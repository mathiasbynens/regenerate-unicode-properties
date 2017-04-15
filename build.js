'use strict';

const fs = require('fs');
const jsesc = require('jsesc');
const emptyDirSync = require('fs-extra').emptyDirSync;
const regenerate = require('regenerate');
const unicode = require('unicode-9.0.0');

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
	return 'require(\'regenerate\')(' + loneCodePoints.join(', ') + ')' +
		(ranges.length ? '.' + ranges.join('.') : '');
};

const INDEX = new Map();

/*----------------------------------------------------------------------------*/

const properties = [
	'General_Category',
	'Script',
	'Script_Extensions',
];

for (const property of properties) {
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
			`unicode-9.0.0/${ property }/${ value }/code-points.js`
		);
		const set = regenerate(codePoints);
		const output = `module.exports = ${ set.toCode() };\n`;
		fs.writeFileSync(fileName, output);
	}
	INDEX.set(property, values.sort());
}

/*----------------------------------------------------------------------------*/

const binaryProperties = [
	'ASCII',
	'ASCII_Hex_Digit',
	'Alphabetic',
	'Any',
	'Assigned',
	'Bidi_Control',
	'Bidi_Mirrored',
	'Case_Ignorable',
	'Cased',
	'Changes_When_Casefolded',
	'Changes_When_Casemapped',
	'Changes_When_Lowercased',
	'Changes_When_NFKC_Casefolded',
	'Changes_When_Titlecased',
	'Changes_When_Uppercased',
	'Dash',
	'Default_Ignorable_Code_Point',
	'Deprecated',
	'Diacritic',
	'Extender',
	'Full_Composition_Exclusion',
	'Grapheme_Base',
	'Grapheme_Extend',
	'Hex_Digit',
	'IDS_Binary_Operator',
	'IDS_Trinary_Operator',
	'ID_Continue',
	'ID_Start',
	'Ideographic',
	'Join_Control',
	'Logical_Order_Exception',
	'Lowercase',
	'Math',
	'Noncharacter_Code_Point',
	'Pattern_Syntax',
	'Pattern_White_Space',
	'Quotation_Mark',
	'Radical',
	'Sentence_Terminal',
	'Soft_Dotted',
	'Terminal_Punctuation',
	'Unified_Ideograph',
	'Uppercase',
	'Variation_Selector',
	'White_Space',
	'XID_Continue',
	'XID_Start'
];

// Empty the target directory, or create it if it doesn’t exist yet.
const directory = 'Binary_Property';
console.log(`Emptying ${ directory }…`);
emptyDirSync(directory);
for (const property of binaryProperties) {
	const fileName = `${ directory }/${ property }.js`;
	console.log(`Creating ${ fileName }…`);
	const codePoints = require(
		`unicode-9.0.0/Binary_Property/${ property }/code-points.js`
	);
	const set = regenerate(codePoints);
	const output = `module.exports = ${ set.toCode() };\n`;
	fs.writeFileSync(fileName, output);
}

const emojiBinaryProperties = require('unicode-tr51');
for (const property of emojiBinaryProperties) {
	const fileName = `Binary_Property/${ property }.js`;
	console.log(`Creating ${ fileName }…`);
	const codePoints = require(
		`unicode-tr51/${ property }.js`
	);
	const set = regenerate(codePoints);
	const output = `module.exports = ${ set.toCode() };\n`;
	fs.writeFileSync(fileName, output);
}

const allBinaryProperties = binaryProperties
	.concat(emojiBinaryProperties)
	.sort();
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
const unicodePackage = dependencies.find((name) =>/^unicode-\d/.test(name));
const unicodeVersion = unicodePackage.replace(/^unicode-/g, '');

const versionOutput = `module.exports = ${
	jsesc(unicodeVersion, {
		'wrap': true
	})
};\n`;
fs.writeFileSync('unicode-version.js', versionOutput);
