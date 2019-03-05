import test from 'ava';
import regenerate from 'regenerate';
import matchLoosely from '../index.js';

test('regenerate-unicode-properties', t => {
	t.true(
		require('../Binary_Property/ASCII.js') instanceof regenerate
	);
	t.true(
		require('../Binary_Property/Emoji.js') instanceof regenerate
	);
	t.true(
		require('../Binary_Property/Emoji.js').toRegExp().test('\u{1F921}') // U+1F921 CLOWN FACE
	);
	t.throws(
		() => require('../Invalid_Property/X.js'),
		Error
	);
	t.throws(
		() => require('../Script_Extensions/Invalid_Property_Value.js'),
		Error
	);
	t.true(
		/^\d+\.\d+\.\d+$/.test(require('../unicode-version.js'))
	);
});
