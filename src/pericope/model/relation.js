import _ from 'lodash';
import Connectable from './connectable';

export default class Relation extends Connectable {
	/**
	 * @constructor
	 * @param {(Relation|Proposition)[]} associates - related elements in this relation
	 * @param {RelationTemplate} template - definition which roles and weights should be applied to the associates
	 */
	constructor(associates, template) {
		super();

		this.associates = associates;
		const roles = template.getAssociateRoles(associates.length);
		_.forEach(this.associates, (associate, index) => {
			associate.superOrdinatedRelation = this;
			associate.role = roles[index];
		});
	}

	/**
	 * @returns {integer} how many levels of relations are stacked on oneanother (including this one)
	 */
	get treeDepth() {
		const associateRelations = _.filter(this.associates, associate => associate instanceof Relation);
		if (associateRelations.length === 0) {
			// this relation contains only propositions
			return 1;
		}
		// recursively retrieve sub tree depth of subordinated relations
		return 1 + _.max(_.map(associateRelations, associate => associate.treeDepth));
	}

	/**
	 * @returns {Proposition} very first proposition (in origin text order) contained in this relation sub tree
	 */
	get firstContainedProposition() {
		let firstAssociate = this;
		do {
			firstAssociate = firstAssociate.associates[0];
		} while (firstAssociate.associates);
		return firstAssociate;
	}

	/**
	 * @returns {Proposition} very last proposition (in origin text order) contained in this relation sub tree
	 */
	get lastContainedProposition() {
		let lastAssociate = this;
		do {
			lastAssociate = lastAssociate.associates[lastAssociate.associates.length - 1];
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
		_.forEach(this.associates, associate => {
			associate.superOrdinatedRelation = null;
			associate.role = null;
		});
	}

	toString() {
		return `Relation(${this.associates})`;
	}
}
