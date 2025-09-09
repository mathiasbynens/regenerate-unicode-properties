const test = require('node:test');
const regenerate = require('regenerate');

test('regenerate-unicode-properties', t => {
	t.assert.ok(
		require('../Binary_Property/ASCII.js').characters instanceof regenerate
	);
	t.assert.ok(
		require('../Binary_Property/Emoji.js').characters instanceof regenerate
	);
	t.assert.ok(
		require('../Binary_Property/Emoji.js').characters.toRegExp().test('\u{1F921}') // U+1F921 CLOWN FACE
	);
	t.assert.throws(
		() => require('../Invalid_Property/X.js')
	);
	t.assert.throws(
		() => require('../Script_Extensions/Invalid_Property_Value.js')
	);
	t.assert.ok(
		/^\d+\.\d+\.\d+$/.test(require('../unicode-version.js'))
	);
});
