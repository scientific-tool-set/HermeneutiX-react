import { List } from 'immutable';

const parentSymbol = Symbol('parent');
const partBeforeArrowSymbol = Symbol('partBeforeArrow');
const partAfterArrowSymbol = Symbol('partAfterArrow');
const priorChildrenSymbol = Symbol('priorChildren');
const laterChildrenSymbol = Symbol('laterChildren');

export default class Proposition {
	/**
	 * @constructor
	 * @param {List<ClauseItem>|ClauseItem[]} clauseItems - contained clause items
	 */
	constructor(clauseItems) {
		this.label = '';
		this.comment = '';

		this.syntacticFunction = null;
		this.syntacticTranslation = '';
		this.clauseItems = List(clauseItems);
		this[parentSymbol] = null;

		this.superOrdinatedRelation = null;
		this.role = null;
		this.semanticTranslation = '';

		this[priorChildrenSymbol] = List();
		this[laterChildrenSymbol] = List();
		this[partBeforeArrowSymbol] = null;
		this[partAfterArrowSymbol] = null;

		Object.seal(this);
	}

	/**
	 * @returns {Pericope|Propostion} superordinated model element
	 */
	get parent() {
		return this[parentSymbol];
	}

	/**
	 * @param {Pericope|Proposition} parent - superordinated model element
	 */
	set parent(parent) {
		const firstPart = this.firstPart;
		if (firstPart.parent !== parent) {
			let singlePart = firstPart;
			do {
				singlePart[parentSymbol] = parent;
				singlePart = singlePart.partAfterArrow;
			} while (singlePart);
		}
	}

	get priorChildren() {
		return this[priorChildrenSymbol];
	}

	set priorChildren(priorChildren) {
		this[priorChildrenSymbol] = priorChildren;
		priorChildren.filter(child => child.parent !== this).forEach(child => {
			child.parent = this;
		});
	}

	get laterChildren() {
		return this[laterChildrenSymbol];
	}

	set laterChildren(laterChildren) {
		this[laterChildrenSymbol] = laterChildren;
		laterChildren.filter(child => child.parent !== this).forEach(child => {
			child.parent = this;
		});
	}

	/**
	 * @returns {Proposition|null} proposition part in front of enclosed child propositions
	 */
	get partBeforeArrow() {
		return this[partBeforeArrowSymbol];
	}

	/**
	 * @returns {Proposition|null} proposition part after enclosed child propositions
	 */
	get partAfterArrow() {
		return this[partAfterArrowSymbol];
	}

	/**
	 * Set the partAfterArrow and update its partBeforeArrow back reference accordingly.
	 * @param {Proposition|null} partAfterArrow - proposition part to set as partAfterArrow
	 */
	set partAfterArrow(partAfterArrow) {
		if (partAfterArrow) {
			// set the back reference on the following part
			partAfterArrow[partBeforeArrowSymbol] = this;
			partAfterArrow.parent = this.parent;
		} else if (this.partAfterArrow) {
			// clear the back reference on the previously following part
			this.partAfterArrow[partBeforeArrowSymbol] = null;
		}
		this[partAfterArrowSymbol] = partAfterArrow;
	}

	/**
	 * @returns {Proposition} very first partBeforeArrow of this proposition (can be this proposition)
	 */
	get firstPart() {
		let result = this;
		while (result.partBeforeArrow) {
			result = result.partBeforeArrow;
		}
		return result;
	}

	/**
	 * @returns {Proposition} very last partAfterArrow of this proposition (can be this proposition)
	 */
	get lastPart() {
		let result = this;
		while (result.partAfterArrow) {
			result = result.partAfterArrow;
		}
		return result;
	}

	toString() {
		return `Proposition(${this.clauseItems.map(item => '"' + item.originText + '"').toJS()})`;
	}
}
