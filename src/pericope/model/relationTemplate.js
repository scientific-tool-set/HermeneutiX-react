import { List, Repeat } from 'immutable';

/**
 * Template for semantic Relations, defining the roles (i.e. semantic function and weights) in the default order.
 */
export default class RelationTemplate {
	/**
	 * @constructor
	 * @param {AssociateRole} leadingAssociate - first associate's role/weight
	 * @param {?AssociateRole} repetitiveAssociate - recurring associate's role/weight (if there are more than two associates)
	 * @param {AssociateRole} trailingAssociate - last associate's role/weight
	 * @param {string} [description = null] - description of the represented relation type
	 */
	constructor(leadingAssociate, repetitiveAssociate, trailingAssociate, description = null) {
		this.leadingAssociate = leadingAssociate;
		this.repetitiveAssociate = repetitiveAssociate;
		this.trailingAssociate = trailingAssociate;
		this.description = description;

		Object.freeze(this);
	}

	/**
	 * @returns {boolean} whether this template supports relations with more than two associates
	 */
	get canHaveMoreThanTwoAssociates() {
		return this.repetitiveAssociate !== null;
	}

	/**
	 * @param {integer} associateCount - number of associates in the targeted relation
	 * @returns {List<AssociateRole>} matching number of associate roles/weights
	 */
	getAssociateRoles(associateCount) {
		if (associateCount < 2 || associateCount > 2 && !this.canHaveMoreThanTwoAssociates) {
			throw new Error('invalid number of associates for relation: ' + associateCount);
		}
		return List.of(
				this.leadingAssociate,
				...Repeat(this.repetitiveAssociate, associateCount - 2),
				this.trailingAssociate);
	}
}
