import test from 'ava';
import regenerate from 'regenerate';
import matchLoosely from '../index.js';

test(t => {
	t.true(
		require('../Bidi_Class/Arabic_Letter.js') instanceof regenerate
	);
	t.throws(
		() => require('../Invalid_Property/X.js'),
		Error
	);
	t.throws(
		() => require('../Bidi_Class/Invalid_Property_Value.js'),
		Error
	);
});
