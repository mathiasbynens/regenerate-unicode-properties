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

const properties = require('./index.js');

for (const property of properties) {
	// Empty the target directory, or create it if it doesn’t exist yet.
	const directory = `${ property }`;
	console.log(`Emptying ${ directory }…`);
	emptyDirSync(directory);
	console.assert(unicode[property], `Property ${ property } not found.`);
	for (const value of unicode[property]) {
		const fileName = `${ directory }/${ value }.js`;
		console.log(`Creating ${ fileName }…`);
		const codePoints = require(
			`unicode-9.0.0/${ property }/${ value }/code-points.js`
		);
		const set = regenerate(codePoints);
		const output = `module.exports = ${ set.toCode() };\n`;
		fs.writeFileSync(fileName, output);
	}
}
