import _ from 'lodash';
import Connectable from './connectable';

const parentSymbol = Symbol('parent');
const clauseItemsSymbol = Symbol('clauseItems');
const partBeforeArrowSymbol = Symbol('partBeforeArrow');
const partAfterArrowSymbol = Symbol('partAfterArrow');
const priorChildrenSymbol = Symbol('priorChildren');
const laterChildrenSymbol = Symbol('laterChildren');

export default class Proposition extends Connectable {
	/**
	 * @constructor
	 * @param {ClauseItem[]} clauseItems - contained clause items
	 * @param {Pericope|Proposition} [parent = null] - superordinated element (proposition or pericope)
	 */
	constructor(clauseItems, parent = null) {
		super();

		this.label = '';
		this.syntacticFunction = null;
		this.syntacticTranslation = '';
		this.semanticTranslation = '';
		this[clauseItemsSymbol] = clauseItems;
		_.forEach(clauseItems, item => {
			item.parent = this;
		});

		this[parentSymbol] = parent;
		this[priorChildrenSymbol] = [ ];
		this[laterChildrenSymbol] = [ ];
		this[partBeforeArrowSymbol] = null;
		this[partAfterArrowSymbol] = null;
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
		let singlePart = this.firstPart;
		do {
			singlePart[parentSymbol] = parent;
			singlePart = singlePart.partAfterArrow;
		} while (singlePart);
	}

	/**
	 * @returns {ClauseItem[]} clause items contained in this proposition
	 */
	get clauseItems() {
		return this[clauseItemsSymbol];
	}

	/**
	 * @param {ClauseItem[]} items - clause items contained in this proposition
	 */
	set clauseItems(items) {
		this[clauseItemsSymbol] = items;
		_.forEach(items, item => {
			item.parent = this;
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

	/**
	 * @returns {Proposition[]} subordinated propositions preceeding this one (in origin text order)
	 */
	get priorChildren() {
		return this[priorChildrenSymbol];
	}

	/**
	 * @param {Proposition[]} children - subordinated propositions preceeding this one (in origin text order)
	 */
	set priorChildren(children) {
		this[priorChildrenSymbol] = children;
		_.forEach(children, child => {
			child.parent = this;
		});
	}

	/**
	 * @returns {Proposition[]} subordinated propositions following this one (in origin text order)
	 */
	get laterChildren() {
		return this[laterChildrenSymbol];
	}

	/**
	 * @param {Proposition[]} children - subordinated propositions following this one (in origin text order)
	 */
	set laterChildren(children) {
		this[laterChildrenSymbol] = children;
		_.forEach(children, child => {
			child.parent = this;
		});
	}

	/**
	 * Find the list of child propositions containing the given.
	 * This might be either the priorChildren, laterChildren, or one of the former two on a partAfterArrow.
	 * @param {Proposition} childProposition - subordinated element to find containing list for
	 * @returns {Proposition[]|null} list of child propositions containing the given childProposition
	 */
	getContainingList(childProposition) {
		let part = this;
		do {
			if (_.includes(part.priorChildren, childProposition)) {
				return part.priorChildren;
			}
			if (_.includes(part.laterChildren, childProposition)) {
				return part.laterChildren;
			}
			part = part.partAfterArrow;
		} while (part);
		return null;
	}

	/**
	 * Prepend the provided child proposition to the priorChildren.
	 * @param {Proposition} childToAdd - child proposition to subordinate
	 * @returns {void}
	 */
	addLeadingPriorChild(childToAdd) {
		childToAdd.parent = this;
		this.priorChildren.unshift(childToAdd);
	}

	/**
	 * Append the provided child proposition to the priorChildren.
	 * @param {Proposition} childToAdd - child proposition to subordinate
	 * @returns {void}
	 */
	addTrailingPriorChild(childToAdd) {
		childToAdd.parent = this;
		this.priorChildren.push(childToAdd);
	}

	/**
	 * Prepend the provided child proposition to the laterChildren.
	 * @param {Proposition} childToAdd - child proposition to subordinate
	 * @returns {void}
	 */
	addLeadingLaterChild(childToAdd) {
		childToAdd.parent = this;
		this.laterChildren.unshift(childToAdd);
	}

	/**
	 * Append the provided child proposition to the laterChildren.
	 * @param {Proposition} childToAdd - child proposition to subordinate
	 * @returns {void}
	 */
	addTrailingLaterChild(childToAdd) {
		childToAdd.parent = this;
		this.laterChildren.push(childToAdd);
	}

	/**
	 * Remove the given subordinated child proposition from this one (or one of its partAfterArrows).
	 * @param {Proposition} childToRemove - proposition to remove from the list of subordinated children
	 * @returns {void}
	 */
	removeChild(childToRemove) {
		const children = this.getContainingList(childToRemove);
		if (children) {
			// given proposition is an actual child (including partAfterArrows)
			children.splice(_.indexOf(children, childToRemove), 1);
		} else if (childToRemove.partBeforeArrow) {
			// given proposition is a partAfterArrow, just remove it from its counter part
			childToRemove.partBeforeArrow.partAfterArrow = null;
		} else {
			throw new Error(`Could not remove given proposition as it could not be found: ${childToRemove}`);
		}
	}

	/**
	 * Insert the provided clause item behind the other specified clause item.
	 * @param {ClauseItem} itemToAdd - clause item to add behind priorItem
	 * @param {ClauseItem} priorItem - existing clause item designated to preceed the new clause item
	 * @returns {void}
	 */
	addClauseItemAfterPrior(itemToAdd, priorItem) {
		itemToAdd.parent = this;
		this.clauseItems.splice(_.indexOf(this.clauseItems, priorItem) + 1, 0, itemToAdd);
	}

	/**
	 * Remove all specified clause items.
	 * @param {ClauseItem[]} itemsToRemove - clause items to remove
	 * @returns {void}
	 */
	removeClauseItems(itemsToRemove) {
		_.forEach(itemsToRemove, item => {
			this.clauseItems.splice(_.indexOf(this.clauseItems, item), 1);
		});
	}

	toString() {
		return `Proposition(${_.map(this.clauseItems, item => '"' + item.originText + '"')})`;
	}
}
