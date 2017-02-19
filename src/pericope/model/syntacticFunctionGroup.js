import { List } from 'immutable';

/**
 * Group of SyntacticFunction elements and potentially nested groups.
 */
export default class SyntacticFunctionGroup {
	/**
	 * @constructor
	 * @param {string} name - (long) representation of this grouping of syntactic functions
	 * @param {string} description - additional description when the contained syntactic functions are applicable
	 * @param {SyntacticFunction|SyntacticFunctionGroup[]} subFunctions - contained syntactic functions and nested groups
	 */
	constructor(name, description, subFunctions) {
		this.name = name;
		this.description = description;
		this.subFunctions = List(subFunctions);

		Object.freeze(this);
	}
}
