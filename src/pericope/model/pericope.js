import { List, Seq } from 'immutable';

export default class Pericope {
	/**
	 * @constructor
	 * @param {List<Proposition>|Proposition[]} text - top level propositions of this pericope
	 * @param {LanguageModel} language - origin text's language
	 */
	constructor(text, language) {
		this.text = List(text);
		this.language = language;

		Object.seal(this);
	}

	/**
	 * @returns {Seq<Proposition>} all contained propositions in the origin text order
	 */
	get flatText() {
		const flattenProposition = proposition => {
			return proposition.priorChildren.flatMap(flattenProposition).concat(
					proposition,
					proposition.laterChildren.flatMap(flattenProposition),
					proposition.partAfterArrow ? flattenProposition(proposition.partAfterArrow) : List()
					);
		};
		return Seq(this.text).flatMap(flattenProposition);
	}

	/**
	 * Find the model element immediately containing the given proposition as its child.
	 * @param {Proposition} child - proposition to find the parent element for
	 * @returns {Pericope|Proposition} parent proposition or in case of the given one being a top level proposition, the pericope itself
	 */
	getDirectParent(child) {
		if (this.isParentOf(child)) {
			// target is a top level proposition
			return this;
		}
		// target is subordinated (at least once) under another proposition
		return this.flatText.find(proposition => proposition.isParentOf(child));
	}

	/**
	 * @param {Proposition} proposition - proposition to check for
	 * @returns {boolean} whether the given proposition is a top level element in this pericope
	 */
	isParentOf(proposition) {
		return this.text.flatMap(topLevel => topLevel.allParts).includes(proposition);
	}

	/**
	 * Check whether the given proposition is one of the top level propositions. If so, return that list.
	 * @param {Proposition} childProposition - subordinated element to check for
	 * @returns {List<Proposition>|undefined} list of top level propositions containing the given one
	 */
	getContainingList(childProposition) {
		return this.text.includes(childProposition) ? this.text : null;
	}

	/**
	 * Check whether the given proposition is one of the top level propositions.
	 * If so, return that list and the corresponding setter function (with a single List<Proposition> parameter).
	 * @param {Proposition} childProposition - subordinated element to check for
	 * @returns {List<Proposition>|undefined} list of top level propositions containing the given one, or undefined
	 * @returns {{list: List<Proposition>, setter: function}|undefined} list of top level propositions containing the given one and the setter for it
	 */
	getContainingListWithSetter(childProposition) {
		if (this.text.includes(childProposition)) {
			return {
				list: this.text,
				setter: newList => {
					this.text = newList;
				}
			};
		}
		return null;
	}

	/**
	 * Add the given propositions on the top level in front of the current propositions.
	 * @param {List<Proposition>|Proposition[]} newPropositions - propositions to add in front of existing propositions
	 * @returns {void}
	 */
	prependPropositions(newPropositions) {
		this.text = this.text.unshift(...newPropositions);
	}

	/**
	 * Add the given propositions on the top level behind the current propositions.
	 * @param {List<Proposition>|Proposition[]} newPropositions - propositions to add after the existing propositions
	 * @returns {void}
	 */
	appendPropositions(newPropositions) {
		this.text = this.text.push(...newPropositions);
	}

	/**
	 * Remove the given proposition from the list of top level propositions,
	 * or in case of it being a partAfterArrow cut it off from its partBeforeArrow.
	 * @param {Proposition} childToRemove - proposition to remove
	 * @returns {void}
	 */
	removeChild(childToRemove) {
		if (this.text.includes(childToRemove)) {
			// given proposition is an actual child
			this.text = this.text.remove(this.text.indexOf(childToRemove));
		} else if (childToRemove.partBeforeArrow) {
			// given proposition is a partAfterArrow, just remove it from its counter part
			childToRemove.partBeforeArrow.partAfterArrow = null;
		} else {
			throw new Error(`Could not remove given proposition as it could not be found: ${childToRemove}`);
		}
	}
}
