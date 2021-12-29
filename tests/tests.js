const test = require('ava');
const regenerate = require('regenerate');

test('regenerate-unicode-properties', t => {
	t.true(
		require('../Binary_Property/ASCII.js').characters instanceof regenerate
	);
	t.true(
		require('../Binary_Property/Emoji.js').characters instanceof regenerate
	);
	t.true(
		require('../Binary_Property/Emoji.js').characters.toRegExp().test('\u{1F921}') // U+1F921 CLOWN FACE
	);
	t.throws(
		() => require('../Invalid_Property/X.js'),
		{ instanceOf: Error }
	);
	t.throws(
		() => require('../Script_Extensions/Invalid_Property_Value.js'),
		{ instanceOf: Error }
	);
	t.true(
		/^\d+\.\d+\.\d+$/.test(require('../unicode-version.js'))
	);
});
