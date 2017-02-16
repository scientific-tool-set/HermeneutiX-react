export default class SyntacticFunctionGroup {
	/**
	 * @constructor
	 * @param {string} name - (long) representation of this grouping of syntactic functions
	 * @param {string} [description = null] - additional description when the contained syntactic functions are applicable
	 * @param {SyntacticFunction[]} [subFunctions] - contained syntactic functions
	 */
	constructor(name, description = null, subFunctions = []) {
		this.name = name;
		this.description = description;
		this.subFunctions = subFunctions;
	}
}
