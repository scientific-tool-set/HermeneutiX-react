/**
 * Single clause item (or token) in the origin text part represented by the surrounding parent Proposition.
 */
export default class ClauseItem {
	/**
	 * @constructor
	 * @param {string} originText - represented token in origin text
	 * @param {SyntacticFunction} [syntacticFunction = null] - syntactic function in surrounding Proposition (parent)
	 * @param {string} [comment = ''] - additional comment regarding this clause item
	 */
	constructor(originText, syntacticFunction = null, /* fontStyle = null, */ comment = '') {
		this.originText = originText;
		this.syntacticFunction = syntacticFunction;
		// this.fontStyle = fontStyle;
		this.comment = comment;

		Object.seal(this);
	}

	toString() {
		return `ClauseItem("${this.originText}", syntacticFunction: ${this.syntacticFunction})`;
	}
}
