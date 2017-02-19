export default class SyntacticFunction {
	/**
	 * @constructor
	 * @param {string} code - short representation of this syntactic function
	 * @param {string} name - long representation of this syntactic function
	 * @param {boolean} [underlined = false] - whether a clause item with this syntactic function should be underlined
	 * @param {string} [description = null] - additional description when this syntactic function is applicable
	 */
	constructor(code, name, underlined = false, description = null) {
		this.code = code;
		this.name = name;
		this.underlined = underlined;
		this.description = description;

		Object.freeze(this);
	}
}
