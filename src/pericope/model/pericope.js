import _ from 'lodash';

export default class Pericope {
	/**
	 * @constructor
	 * @param {Proposition[]} text - top level propositions of this pericope
	 * @param {LanguageModel} language - origin text's language
	 */
	constructor(text, language) {
		this.text = text;
		_.forEach(text, proposition => {
			proposition.parent = this;
		});
		this.language = language;
	}

	/**
	 * @returns {Proposition[]} all contained propositions in the origin text order
	 */
	get flatText() {
		const flatPropositions = proposition => {
			return _.concat(
					_.flatMap(proposition.priorChildren, flatPropositions),
					proposition,
					_.flatMap(proposition.laterChildren, flatPropositions),
					proposition.partAfterArrow ? flatPropositions(proposition.partAfterArrow) : [ ]
					);
		};
		return _.flatMap(this.text, flatPropositions);
	}

	/**
	 * Check whether the given proposition is one of the top level propositions. If so, return that list.
	 * @param {Proposition} childProposition - subordinated element to check for
	 * @returns {Proposition[]|null} list of top level propositions containing the given one, or null
	 */
	getContainingList(childProposition) {
		return _.includes(this.text, childProposition) ? this.text : null;
	}

	/**
	 * Add the given propositions on the top level in front of the current propositions.
	 * @param {Proposition[]} newPropositions - propositions to add in front of existing propositions
	 * @returns {void}
	 */
	prependPropositions(newPropositions) {
		_.forEachRight(newPropositions, proposition => {
			proposition.parent = this;
			this.text.unshift(proposition);
		});
	}

	/**
	 * Add the given propositions on the top level behind the current propositions.
	 * @param {Proposition[]} newPropositions - propositions to add after the existing propositions
	 * @returns {void}
	 */
	appendPropositions(newPropositions) {
		_.forEach(newPropositions, proposition => {
			proposition.parent = this;
			this.text.push(proposition);
		});
	}

	/**
	 * Remove the given proposition from the list of top level propositions,
	 * or in case of it being a partAfterArrow cut it off from its partBeforeArrow.
	 * @param {Proposition} childToRemove - proposition to remove
	 * @returns {void}
	 */
	removeChild(childToRemove) {
		if (_.includes(this.text, childToRemove)) {
			// given proposition is an actual child
			this.text.splice(_.indexOf(this.text, childToRemove), 1);
		} else if (childToRemove.partBeforeArrow) {
			// given proposition is a partAfterArrow, just remove it from its counter part
			childToRemove.partBeforeArrow.partAfterArrow = null;
		} else {
			throw new Error(`Could not remove given proposition as it could not be found: ${childToRemove}`);
		}
	}
}
