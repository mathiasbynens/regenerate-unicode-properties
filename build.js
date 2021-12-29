'use strict';

const fs = require('fs');
const jsesc = require('jsesc');
const emptyDirSync = require('fs-extra').emptyDirSync;
const regenerate = require('regenerate');
const UNICODE_VERSION = '14.0.0';
const unicode = require(`@unicode/unicode-${ UNICODE_VERSION }`);

/*----------------------------------------------------------------------------*/

const codePointToString = function(codePoint) {
	return '0x' + codePoint.toString(16).toUpperCase();
};

// Regenerate plugin that turns a set into some JavaScript source code that
// generates that set.
regenerate.prototype.toCode = function() {
	const data = this.data;
	// Iterate over the data per `(start, end)` pair.
	let index = 0;
	let start;
	let end;
	const length = data.length;
	const loneCodePoints = [];
	const ranges = [];
	while (index < length) {
		start = data[index];
		end = data[index + 1] - 1; // Note: the `- 1` makes `end` inclusive.
		if (start == end) {
			loneCodePoints.push(codePointToString(start));
		} else {
			ranges.push(
				'addRange(' + codePointToString(start) +
				', ' + codePointToString(end) + ')'
			);
		}
		index += 2;
	}
	let output = 'const set = require(\'regenerate\')(' + loneCodePoints.join(', ') + ');\n';
	if (ranges.length > 0) {
		let i = 0;
		output += 'set';
		// Avoid deeply-nested ASTs.
		// https://github.com/babel/babel/issues/8278
		const MAX_CHAINED_CALLS = 50;
		for (const range of ranges) {
			if (i++ == MAX_CHAINED_CALLS) {
				i = 0;
				output += '.' + range + ';\nset';
			} else {
				output += '.' + range;
			}
		}
		output += ';';
	}
	return output;
};

const INDEX = new Map();

/*----------------------------------------------------------------------------*/

const nonBinaryProperties = [
	'General_Category',
	'Script',
	'Script_Extensions',
];

for (const property of nonBinaryProperties) {
	const values = [];
	// Empty the target directory, or create it if it doesn’t exist yet.
	const directory = `${ property }`;
	console.log(`Emptying ${ directory }…`);
	emptyDirSync(directory);
	console.assert(unicode[property], `Property ${ property } not found.`);
	for (const value of unicode[property]) {
		values.push(value);
		const fileName = `${ directory }/${ value }.js`;
		console.log(`Creating ${ fileName }…`);
		const codePoints = require(
			`@unicode/unicode-${ UNICODE_VERSION }/${ property }/${ value }/code-points.js`
		);
		const set = regenerate(codePoints);
		const output = `${ set.toCode() }\nexports.characters = set;\n`;
		fs.writeFileSync(fileName, output);
	}
	INDEX.set(property, values.sort());
}

/*----------------------------------------------------------------------------*/

const supportedProperties = require('unicode-canonical-property-names-ecmascript');
for (const property of nonBinaryProperties) {
	supportedProperties.delete(property);
}
const binaryProperties = [...supportedProperties];

// Empty the target directory, or create it if it doesn’t exist yet.
const directory = 'Binary_Property';
console.log(`Emptying ${ directory }…`);
emptyDirSync(directory);
for (const property of binaryProperties) {
	const fileName = `${ directory }/${ property }.js`;
	console.log(`Creating ${ fileName }…`);
	const codePoints = require(
		`@unicode/unicode-${ UNICODE_VERSION }/Binary_Property/${ property }/code-points.js`
	);
	const set = regenerate(codePoints);
	const output = `${ set.toCode() }\nexports.characters = set;\n`;
	fs.writeFileSync(fileName, output);
}

const propertiesOfStrings = [
	'Basic_Emoji',
	'Emoji_Keycap_Sequence',
	'RGI_Emoji_Modifier_Sequence',
	'RGI_Emoji_Flag_Sequence',
	'RGI_Emoji_Tag_Sequence',
	'RGI_Emoji_ZWJ_Sequence',
	'RGI_Emoji',
];
for (const property of propertiesOfStrings) {
	binaryProperties.push(property);

	const fileName = `${ directory }/${ property }.js`;
	console.log(`Creating ${ fileName }…`);
	const rawStrings = require(`@unicode/unicode-${ UNICODE_VERSION }/Sequence_Property/${ property }/index.js`);
	const codePoints = [];
	const strings = [];
	for (const rawString of rawStrings) {
		if (rawString.length === 1 || (rawString.length === 2 && rawString.codePointAt(0) > 0xffff)) {
			codePoints.push(rawString.codePointAt(0));
		} else {
			strings.push(rawString);
		}
	}
	const set = regenerate(codePoints);
	const output = `${ set.toCode() }\nexports.characters = set;\nexports.strings = ${ jsesc(strings, { minimal: true }) };\n`;
	fs.writeFileSync(fileName, output);
}

const allBinaryProperties = binaryProperties.sort();
INDEX.set('Binary_Property', allBinaryProperties);

/*----------------------------------------------------------------------------*/

const output = `module.exports = ${
	jsesc(INDEX, {
		'compact': false
	})
};\n`;
fs.writeFileSync('index.js', output);

/*----------------------------------------------------------------------------*/

const packageData = require('./package.json');
const dependencies = Object.keys(packageData.devDependencies);
const unicodePackage = dependencies.find((name) =>/^@unicode\/unicode-\d/.test(name));
const unicodeVersion = unicodePackage.replace(/^@unicode\/unicode-/g, '');
const versionOutput = `module.exports = ${
	jsesc(unicodeVersion, {
		'wrap': true
	})
};\n`;
fs.writeFileSync('unicode-version.js', versionOutput);
