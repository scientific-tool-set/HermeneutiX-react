import { List } from 'immutable';

export default class Pericope {
	/**
	 * @constructor
	 * @param {List<Proposition>|Proposition[]} text - top level propositions of this pericope
	 * @param {LanguageModel} language - origin text's language
	 */
	constructor(text, language) {
		this.text = List(text);
		this.text.forEach(proposition => {
			proposition.parent = this;
		});
		this.language = language;

		Object.seal(this);
	}
}
