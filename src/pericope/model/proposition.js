import { List, Seq } from 'immutable';

const partBeforeArrowSymbol = Symbol('partBeforeArrow');
const partAfterArrowSymbol = Symbol('partAfterArrow');

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

		this.superOrdinatedRelation = null;
		this.role = null;
		this.semanticTranslation = '';

		this.priorChildren = List();
		this.laterChildren = List();
		this[partBeforeArrowSymbol] = null;
		this[partAfterArrowSymbol] = null;

		Object.seal(this);
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

	get allParts() {
		let allParts = List.of(this);
		if (this.partAfterArrow) {
			allParts = allParts.withMutations(list => {
				let part = this.partAfterArrow;
				while (part) {
					list.push(part);
					part = part.partAfterArrow;
				}
			});
		}
		return allParts;
	}

	/**
	 * @param {Proposition} child - child proposition to check for
	 * @returns {boolean} whether the given proposition is a subordinated child of this proposition
	 */
	isParentOf(child) {
		return Seq(this.priorChildren).concat(this.laterChildren).flatMap(proposition => proposition.allParts).includes(child);
	}

	/**
	 * Find the list of child propositions containing the given one.
	 * This might be either the priorChildren, laterChildren, or one of the former two on a partAfterArrow.
	 * @param {Proposition} childProposition - subordinated element to find containing list for
	 * @returns {List<Proposition>|undefined} list of child propositions containing the given childProposition
	 */
	getContainingList(childProposition) {
		let part = this;
		do {
			if (part.priorChildren.includes(childProposition)) {
				return part.priorChildren;
			}
			if (part.laterChildren.includes(childProposition)) {
				return part.laterChildren;
			}
			part = part.partAfterArrow;
		} while (part);
		return null;
	}

	/**
	 * Find the list of child propositions containing the given one and the corresponding setter function (with a single List<Proposition> parameter).
	 * This might be either the priorChildren, laterChildren, or one of the former two on a partAfterArrow.
	 * @param {Proposition} childProposition - subordinated element to find containing list for
	 * @returns {{list: List<Proposition>, setter: function}|undefined} list of child propositions containing the given childProposition
	 */
	getContainingListWithSetter(childProposition) {
		const getPriorChildrenWithSetter = proposition => {
			return {
				list: proposition.priorChildren,
				setter: newList => {
					proposition.priorChildren = newList;
				}
			};
		};
		const getLaterChildrenWithSetter = proposition => {
			return {
				list: proposition.laterChildren,
				setter: newList => {
					proposition.laterChildren = newList;
				}
			};
		};
		let part = this;
		do {
			if (part.priorChildren.includes(childProposition)) {
				return getPriorChildrenWithSetter(part);
			}
			if (part.laterChildren.includes(childProposition)) {
				return getLaterChildrenWithSetter(part);
			}
			part = part.partAfterArrow;
		} while (part);
		return null;
	}

	/**
	 * Remove the given subordinated child proposition from this one (or one of its partAfterArrows).
	 * @param {Proposition} childToRemove - proposition to remove from the list of subordinated children
	 * @returns {void}
	 */
	removeChild(childToRemove) {
		const children = this.getContainingListWithSetter(childToRemove);
		if (children) {
			// given proposition is an actual child (including partAfterArrows)
			children.setter(children.list.remove(children.list.indexOf(childToRemove)));
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
		this.clauseItems = this.clauseItems.insert(this.clauseItems.indexOf(priorItem) + 1, itemToAdd);
	}

	/**
	 * Remove all specified clause items.
	 * @param {ClauseItem[]} itemsToRemove - clause items to remove
	 * @returns {void}
	 */
	removeClauseItems(itemsToRemove) {
		itemsToRemove.forEach(item => {
			this.clauseItems = this.clauseItems.remove(this.clauseItems.indexOf(item));
		});
	}

	toString() {
		return `Proposition(${this.clauseItems.map(item => '"' + item.originText + '"').toJS()})`;
	}
}
