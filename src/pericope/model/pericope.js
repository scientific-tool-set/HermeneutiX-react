import { List } from 'immutable';

const textSymbol = Symbol('text');

export default class Pericope {
	/**
	 * @constructor
	 * @param {List<Proposition>|Proposition[]} text - top level propositions of this pericope
	 * @param {LanguageModel} language - origin text's language
	 */
	constructor(text, language) {
		this.text = text;
		this.language = language;

		Object.seal(this);
	}

	get text() {
		return this[textSymbol];
	}

	set text(text) {
		this[textSymbol] = List(text);
		this[textSymbol].forEach(proposition => {
			if (proposition.parent !== this) {
				proposition.parent = this;
			}
		});
	}
}
