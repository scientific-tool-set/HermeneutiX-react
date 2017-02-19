import { List } from 'immutable';

/**
 * Representation of an origin text's language, identified by its text orientation and available syntactic functions.
 */
export default class LanguageModel {
	/**
	 * @constructor
	 * @param {string} name - represented language
	 * @param {boolean} leftToRightOriented - whether text orientation is from left to right
	 * @param {Iterable.<Iterable.<(SyntacticFunction|SyntacticFunctionGroup)>>} functionGroups - available (grouped) syntactic functions
	 */
	constructor(name, leftToRightOriented, functionGroups) {
		this.name = name;
		this.leftToRightOriented = leftToRightOriented;
		this.functionGroups = List(functionGroups.map(group => List(group)));

		Object.freeze(this);
	}

	toString() {
		return `LanguageModel(${this.name})`;
	}
}
