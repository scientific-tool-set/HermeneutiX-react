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
		const roles = List(template.getAssociateRoles(associates.length));
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

	toString() {
		return `Relation(${this.associates.toJS()})`;
	}
}
