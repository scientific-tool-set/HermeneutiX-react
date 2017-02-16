export default class LanguageModel {
	/**
	 * @constructor
	 * @param {string} name - represented language
	 * @param {boolean} leftToRightOriented - whether text orientation is from left to right
	 * @param {Array.<Array.<(SyntacticFunction|SyntacticFunctionGroup)>>} functionGroups - available (grouped) syntactic functions
	 */
	constructor(name, leftToRightOriented, functionGroups) {
		this.name = name;
		this.leftToRightOriented = leftToRightOriented;
		this.functionGroups = functionGroups;
	}

	toString() {
		return `LanguageModel(${this.name})`;
	}
}
