import { List } from 'immutable';

export default class Relation {
	/**
	 * @constructor
	 * @param {(Relation|Proposition)[]} associates - related elements in this relation
	 * @param {RelationTemplate} template - definition which roles and weights should be applied to the associates
	 */
	constructor(associates, template) {
		this.superOrdinatedRelation = null;
		this.role = null;
		this.comment = '';

		this.associates = List(associates);
		const roles = template.getAssociateRoles(associates.length);
		this.associates.forEach((associate, index) => {
			associate.superOrdinatedRelation = this;
			associate.role = roles.get(index);
		});

		Object.seal(this);
	}

	/**
	 * @returns {integer} how many levels of relations are stacked on oneanother (including this one)
	 */
	get treeDepth() {
		const associateRelations = this.associates.filter(associate => associate instanceof Relation);
		if (associateRelations.isEmpty()) {
			// this relation contains only propositions
			return 1;
		}
		// recursively retrieve sub tree depth of subordinated relations
		return 1 + associateRelations.map(associate => associate.treeDepth).max();
	}

	/**
	 * @returns {Proposition} very first proposition (in origin text order) contained in this relation sub tree
	 */
	get firstContainedProposition() {
		let firstAssociate = this;
		do {
			firstAssociate = firstAssociate.associates.first();
		} while (firstAssociate.associates);
		return firstAssociate;
	}

	/**
	 * @returns {Proposition} very last proposition (in origin text order) contained in this relation sub tree
	 */
	get lastContainedProposition() {
		let lastAssociate = this;
		do {
			lastAssociate = lastAssociate.associates.last();
		} while (lastAssociate.associates);
		return lastAssociate;
	}

	/**
	 * Destroy this relation and all super ordinated relations,
	 * thereby also cleaning up any back references from its (now former) associates.
	 * @returns {void}
	 */
	kill() {
		if (this.superOrdinatedRelation) {
			// recursively kill super ordinated relation
			this.superOrdinatedRelation.kill();
		}
		// reset subordinated relations/propositions to belong to no relation
		this.associates.forEach(associate => {
			associate.superOrdinatedRelation = null;
			associate.role = null;
		});
	}

	toString() {
		return `Relation(${this.associates.toJS()})`;
	}
}
