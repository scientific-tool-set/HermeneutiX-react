import _ from 'lodash';

export default class RelationTemplate {
	/**
	 * @constructor
	 * @param {AssociateRole} leadingAssociate - first associate's role/weight
	 * @param {?AssociateRole} repetitiveAssociate - ecurring associate's role/weight (if there are more than two associates)
	 * @param {AssociateRole} trailingAssociate - last associate's role/weight
	 * @param {string} [description = null] - description of the represented relation type
	 */
	constructor(leadingAssociate, repetitiveAssociate, trailingAssociate, description = null) {
		this.leadingAssociate = leadingAssociate;
		this.repetitiveAssociate = repetitiveAssociate;
		this.trailingAssociate = trailingAssociate;
		this.description = description;
	}

	/**
	 * @returns {boolean} whether this template supports relations with more than two associates
	 */
	get canHaveMoreThanTwoAssociates() {
		return this.repetitiveAssociate !== null;
	}

	/**
	 * @param {integer} associateCount - number of associates in the targeted relation
	 * @returns {AssociateRole[]} matching number of associate roles/weights
	 */
	getAssociateRoles(associateCount) {
		if (associateCount < 2 || associateCount > 2 && !this.canHaveMoreThanTwoAssociates) {
			throw new Error('invalid number of associates for relation: ' + associateCount);
		}
		const roles = Array(associateCount);
		roles[0] = this.leadingAssociate;
		_.fill(roles, this.repetitiveAssociate, 1, associateCount - 1);
		roles[associateCount - 1] = this.trailingAssociate;
		return roles;
	}
}
