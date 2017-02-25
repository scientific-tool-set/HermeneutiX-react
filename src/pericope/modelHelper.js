import { List, Seq } from 'immutable';
import PropertyAccessor from './propertyAccessor';
import Pericope from './model/pericope';
import Proposition from './model/proposition';
import ClauseItem from './model/clauseItem';
import Relation from './model/relation';

/**
 * A single ClauseItem converted to an immutable data-only structure.
 * @typedef {object} PlainClauseItem
 * @property {string} originText - the represented part of the origin text
 * @property {?SyntacticFunction} syntacticFunction - th associated syntactic function with its parent proposition
 * @property {?string} comment - additional comment text
 */
/**
 * A single Proposition converted to an immutable structure without circular references (i.e. no back references to objects).
 * @typedef {object} PlainProposition
 * @property {?Array.<PlainProposition>} priorChildren - preceeding subordinated child propositions
 * @property {Array.<PlainClauseItem>} clauseItems - the clause items containing the origin text
 * @property {?string} label - a short identifier
 * @property {?string} syntacticTranslation - associated translation from the syntactic analysis
 * @property {?string} semanticTranslation - associated translation from the semantic analysis
 * @property {?SyntacticFunction} syntacticFunction - syntactic function of this proposition (if it is subordinated to another one)
 * @property {?string} comment - additional comment text
 * @property {?Array.<PlainProposition>} laterChildren - following subordinated child propositions
 * @property {?PlainProposition} partAfterArrow - another part of the same proposition that continues after some enclosed subordinated child propositions
 */
/**
 * Representation of a non-partAfterArrow Proposition in the plain connectable subtree.
 * @typedef {object} PlainPropositionPlaceholder
 * @property {?AssociateRole} role - role and weight of this proposition in its super ordinated relation
 */
/**
 * A single Relation converted to an immutable structure without a circular back reference to its super ordinated relation, in the plain connectable subtree.
 * @typedef {object} PlainRelation
 * @property {Array.<(PlainPropositionPlaceholder|PlainRelation)>} associates - contained propositions and/or relations in this one
 * @property {?AssociateRole} role - role and weight of this relation in its super ordinated relation
 */
/**
 * The object representing a plain Pericope, i.e. the one used as the state.
 * @typedef {object} PlainPericope
 * @property {LanguageModel} language - the associated origin text language with its name, orientation, and syntactic functions
 * @property {Array.<PlainProposition>} text - the list of top level Propositions with their nested child Propositions and partAfterArrows
 * @property {Array.<(PlainPropositionPlaceholder|PlainRelation)>} connectables - the list of relation sub trees filled up with placeholders for unrelated Propositions
 */

/**
 * Construct the representing propositions from the given text.
 * Each line in the given text will be represented by a single proposition.
 * Within a proposition each token separated by a tab ('\t') or by 4+ whitespaces will become a clause item.
 *
 * @param {string} originText - the origin text to be converted to a list of propositions
 * @returns {List.<Proposition>} propositions extracted from text
 */
export function buildPropositionsFromText(originText) {
	// split text at line breaks into propositions
	return List(originText.trim().split(/\s*\n\s*/g).map(line => {
		// split proposition at each tab or occurence of at least four consecutive whitespaces into clause items
		return new Proposition(line.replace(/\s{4,}/g, '\t').split(/\s*\t\s*/g).map(token => {
			// normalize whitespaces (i.e. replace multiple whitespaces by a single one)
			return new ClauseItem(token.replace(/\s{2,}/g, ' '));
		}));
	}));
}

/**
 * Build a flat sequence of all propositions (including partAfterArrows) contained in the given pericope in the origin text order.
 * @param {Pericope|PlainPericope} pericope - pericope for which to construct the flattened proposition sequence
 * @param {boolean} [skipPartAfterArrows = false] - whether to exclude partAfterArrows from the created list
 * @returns {Seq.<Proposition>} all contained propositions in the origin text order
 */
export function getFlatText(pericope, skipPartAfterArrows = false) {
	// use a lazy Seq in order to avoid having to build the whole model as flat list if not necessary
	return Seq(pericope.text).flatMap(prop => flattenProposition(prop, skipPartAfterArrows, false));
}

/**
 * Build a flat sequence of the given proposition and all its subordinated child propositions (including their partAfterArrows) in the origin text order.
 * @param {Proposition|PlainProposition} proposition - proposition to build flat sequence representing its hierarchical structure for
 * @param {boolean} skipPartAfterArrows - whether to exclude partAfterArrows from the created list
 * @param {boolean} isPartAfterArrow - whether the given proposition is a partAfterArrow
 * @returns {Seq.<Proposition>|Seq.<PlainProposition>} flat representation of the proposition's subtree
 */
function flattenProposition(proposition, skipPartAfterArrows, isPartAfterArrow) {
	// use lazy Seqs in order to avoid having to build the whole model as flat list if not necessary
	return Seq(proposition.priorChildren).flatMap(prop => flattenProposition(prop, skipPartAfterArrows, false)).concat(
			skipPartAfterArrows && isPartAfterArrow ? List() : proposition,
			Seq(proposition.laterChildren).flatMap(prop => flattenProposition(prop, skipPartAfterArrows, false)),
			proposition.partAfterArrow ? flattenProposition(proposition.partAfterArrow, skipPartAfterArrows, true) : List()
			);
}

/**
 * Build a flat sequence of all relations contained in the given pericope in some deterministic order.
 * @param {Pericope|PlainPericope} pericope - pericope for which to construct the flattened relation sequence
 * @returns {Seq.<Relation>|Seq.<PlainRelation>} all contained relations in a deterministic order (for identifying matching instances in independent copies of the same pericope)
 */
export function getFlatRelations(pericope) {
	// use a lazy Seq in order to avoid having to iterate all relation trees if not necessary
	const topMostRelations = List().asMutable();
	let nextConnectable = getFlatText(pericope).first();
	do {
		while (nextConnectable.superOrdinatedRelation) {
			// find the top most relation
			nextConnectable = nextConnectable.superOrdinatedRelation;
		}
		if (nextConnectable.associates) {
			// targeted connectable is a relation, add it to the list.
			topMostRelations.push(nextConnectable);
		}
		nextConnectable = getFollowingProposition(nextConnectable, true);
	} while (nextConnectable);
	// recursively collect all associates that are relations too
	return Seq(topMostRelations).flatMap(flattenRelation);
}

/**
 * Build a flat sequence of the given relation and all its associates that are relations as well (recursively).
 * @param {Relation|PlainRelation} relation - relation to build flat sequence representing it with all its associate relations
 * @returns {Seq.<Relation>|Seq.<PlainRelation>} flat representation of the relation's subtree
 */
function flattenRelation(relation) {
	// use a lazy Seq in order to avoid having to iterate all relation trees if not necessary
	return Seq.of(relation).concat(
			Seq(relation.associates).flatMap(associate => associate.associates ? flattenRelation(associate) : List()));
}

/**
 * Find the list of child propositions containing the given one and return an accessor (i.e. a wrapper allowing mutation) for it.
 * If the parent is the pericope the given child proposition would have to be a top level proposition in the pericope's text list.
 * If the parent is a proposition itself, the containing list is either the priorChildren, laterChildren, or one of these two on a partAfterArrow.
 * @param {Pericope|Proposition} parent - parent element to find list of children containing the given one
 * @param {Proposition} childProposition - child proposition to find containing list in parent for
 * @returns {PropertyAccessor|null} wrapper allowing read and write access to the list of child propositions
 */
export function getContainingListInParent(parent, childProposition) {
	if (parent instanceof Proposition) {
		let part = parent;
		do {
			if (part.priorChildren.includes(childProposition)) {
				return new PropertyAccessor(part, 'priorChildren');
			}
			if (part.laterChildren.includes(childProposition)) {
				return new PropertyAccessor(part, 'laterChildren');
			}
			part = part.partAfterArrow;
		} while (part);
	} else if (parent.text.includes(childProposition)) {
		return new PropertyAccessor(parent, 'text');
	}
	return null;
}

/**
 * Under the given pericope or proposition (or one of its partAfterArrows),
 * insert the provided child propostion in front of the specified other subordinated proposition.
 * @param {(Pericope|Proposition)} parent - parent element to add child proposition to
 * @param {Proposition} childToAdd - proposition to subordinate under parent in front of the designated followerProposition
 * @param {Proposition} followerProposition - parent's existing subordinated proposition designated to follow the new child
 * @returns {void}
 */
export function addChildBeforeFollower(parent, childToAdd, followerProposition) {
	const followerMainPart = followerProposition.firstPart;
	const children = getContainingListInParent(parent, followerMainPart);
	children.value = children.value.insert(children.value.indexOf(followerMainPart), childToAdd);
	if (!(parent instanceof Proposition)) {
		// clear the now top level proposition's indentation function
		childToAdd.syntacticFunction = null;
	}
}

/**
 * Under the given pericope or proposition (or one of its partAfterArrows), insert the provided child propostion after the specified other subordinated proposition.
 * @param {(Pericope|Proposition)} parent - parent element to add child proposition to
 * @param {Proposition} childToAdd - proposition to subordinate under parent behind the designated priorProposition
 * @param {Proposition} priorProposition - parent's existing subordinated proposition designated to preced the new child
 * @returns {void}
 */
export function addChildAfterPrior(parent, childToAdd, priorProposition) {
	const priorMainPart = priorProposition.firstPart;
	const children = getContainingListInParent(parent, priorMainPart);
	children.value = children.value.insert(children.value.indexOf(priorMainPart) + 1, childToAdd);
	if (!(parent instanceof Proposition)) {
		// clear the now top level proposition's indentation function
		childToAdd.syntacticFunction = null;
	}
}

/**
 * Remove the given subordinated child proposition from this one (or one of its partAfterArrows).
 * @param {Pericope|Proposition} parent - parent element the child proposition should be removed from
 * @param {Proposition} childToRemove - proposition to remove from the list of subordinated children
 * @returns {void}
 */
export function removeChild(parent, childToRemove) {
	const children = getContainingListInParent(parent, childToRemove);
	if (children) {
		// given proposition is an actual child (including partAfterArrows)
		children.value = children.value.remove(children.value.indexOf(childToRemove));
	} else if (childToRemove.partBeforeArrow) {
		// given proposition is a partAfterArrow, just remove it from its counter part
		childToRemove.partBeforeArrow.partAfterArrow = null;
	} else {
		throw new Error(`Could not remove given proposition as it could not be found: ${childToRemove}`);
	}
}

/**
 * Check whether the given proposition/relation is immediately preceding the given other proposition/relation.
 * @param {(Relation|Proposition)} reference - leading element
 * @param {(Relation|Proposition)} follower - trailing element
 * @param {boolean} [onlyConnectables=false] - whether to skip over proposition parts that cannot be associated with a relation
 * @returns {boolean} whether no other propositions are between
 */
export function isPriorOf(reference, follower, onlyConnectables = false) {
	let followerProposition = follower;
	while (followerProposition.associates) {
		// given follower is a relation, retrieve its first contained proposition
		followerProposition = followerProposition.associates.first();
	}
	return getFollowingProposition(reference, onlyConnectables) === followerProposition;
}

/**
 * Find the immediately following proposition of the given proposition/relation in the origin text.
 * @param {(Relation|Proposition)} reference - prior element
 * @param {boolean} [onlyConnectables=false] - whether to skip over proposition parts that cannot be associated with a relation
 * @returns {Proposition|null} next proposition
 */
export function getFollowingProposition(reference, onlyConnectables = false) {
	let referenceProposition = reference;
	while (referenceProposition.associates) {
		// given reference is a relation, retrieve the last contained proposition
		referenceProposition = referenceProposition.associates.last();
	}
	let followingChildren = referenceProposition.laterChildren;
	if (followingChildren.isEmpty()) {
		// reference proposition does not have later children
		if (referenceProposition.partAfterArrow) {
			// reference proposition has another part which must have prior children
			followingChildren = referenceProposition.partAfterArrow.priorChildren;
			if (followingChildren.isEmpty()) {
				throw new Error('There must be partAfterArrow.priorChildren');
			}
		} else {
			// reference proposition does not have a partAfterArrow
			return getFollowingPropositionDisregardingPriorsChildren(referenceProposition, onlyConnectables);
		}
	}
	let follower;
	do {
		// recursively get the following proposition's leading prior child
		follower = followingChildren.first();
		followingChildren = follower.priorChildren;
	} while (!followingChildren.isEmpty());
	return follower;
}

/**
 * Find the immediately following proposition on the same or higher level of the given prior proposition,
 * disregarding the prior proposition's own later children.
 * @param {Proposition} reference - prior proposition
 * @param {boolean} [onlyConnectables=false] - whether to skip over proposition parts that cannot be associated with a relation
 * @returns {Proposition|null} next proposition
 */
function getFollowingPropositionDisregardingPriorsChildren(reference, onlyConnectables = false) {
	let followingProposition = getFollowingPropositionOnSameOrHigherLevel(reference, onlyConnectables);
	if (!followingProposition) {
		// reference proposition is the last on this model, i.e. there is no following one
		return null;
	}
	let referenceParent = reference;
	while (referenceParent.parent instanceof Proposition) {
		const children = referenceParent.parent.laterChildren;
		if (children.isEmpty() || referenceParent !== children.last()) {
			break;
		}
		// prior proposition is the last later child of its parent, check parent's parent
		referenceParent = referenceParent.parent;
	}
	// find the very first of the following propositions
	let followersPriorChildren = followingProposition.priorChildren;
	while (!followersPriorChildren.isEmpty() && !followersPriorChildren.includes(referenceParent)) {
		// followingProposition got at least one prior child
		const firstFollowersPriorChild = followersPriorChildren.first();
		if (onlyConnectables) {
			let partAfterArrow = firstFollowersPriorChild.partAfterArrow;
			while (partAfterArrow) {
				if (partAfterArrow === referenceParent) {
					break;
				}
				partAfterArrow = partAfterArrow.partAfterArrow;
			}
			if (partAfterArrow) {
				// prior proposition is an enclosed child and followingProposition is behind the partAfterArrow
				// cannot get any closer than the current followingProposition
				break;
			}
		}
		// first prior child of the current result is closer to the prior proposition
		followingProposition = firstFollowersPriorChild;
		// recursively check whether that one also has a prior child (which would be closer)
		followersPriorChildren = followingProposition.priorChildren;
	}
	return followingProposition;
}

/**
 * Find the following proposition in the origin text, skipping any child propositions in between.
 * @param {Proposition} priorProposition - reference proposition to find the following proposition for
 * @param {boolean} [skipPartAfterArrows=false] - whether to skip over proposition parts that cannot be associated with a relation
 * @returns {Proposition|null} next proposition in origin text
 */
export function getFollowingPropositionOnSameOrHigherLevel(priorProposition, skipPartAfterArrows = false) {
	if (!skipPartAfterArrows && priorProposition.partAfterArrow) {
		return priorProposition.partAfterArrow;
	}
	const parent = priorProposition.parent;
	const referenceProposition = priorProposition.firstPart;
	const siblings = getContainingListInParent(parent, referenceProposition).value;
	const followingSiblingIndex = siblings.indexOf(referenceProposition) + 1;
	if (followingSiblingIndex < siblings.size) {
		return siblings.get(followingSiblingIndex);
	}
	// priorProposition got no following sibling, check on a higher level
	return getFollowingPropositionOnHigherLevel(referenceProposition, skipPartAfterArrows);
}

/**
 * Find the following proposition in the origin text, skipping any child or sibling propositions in between.
 * @param {Proposition} priorProposition - reference proposition to find the following proposition for
 * @param {boolean} [skipPartAfterArrows=false] - whether to skip over proposition parts that cannot be associated with a relation
 * @returns {Proposition|null} next proposition in origin text
 */
function getFollowingPropositionOnHigherLevel(priorProposition, skipPartAfterArrows = false) {
	const parent = priorProposition.parent;
	if (!(parent instanceof Proposition)) {
		// priorProposition is the last top lovel proposition in the pericope
		return null;
	}
	if (parent.priorChildren.includes(priorProposition)) {
		// prior is the last child in front of its parent, parent is the next proposition
		if (!skipPartAfterArrows || !parent.partBeforeArrow) {
			return parent;
		}
		// parent is a partAfterArrow that we should skip over
		if (!parent.laterChildren.isEmpty()) {
			return parent.laterChildren.first();
		}
		if (parent.partAfterArrow) {
			// parent is a partAfterArrow and has another partAfterArrow of its own
			// return the first enclosed child between the parent and its partAfterArrow
			return parent.partAfterArrow.priorChildren.first();
		}
	} else if (parent.partAfterArrow) {
		if (!skipPartAfterArrows) {
			// priorProposition is the last later child of the partBeforeArrow
			return parent.partAfterArrow;
		}
		if (parent.partAfterArrow.priorChildren.first()) {
			// return the first enclosed child between the parent and its partAfterArrow
			return parent.partAfterArrow.priorChildren.first();
		}
		if (parent.partAfterArrow.laterChildren.first()) {
			// follower is the first child after the parent's partAfterArrow
			return parent.partAfterArrow.laterChildren.first();
		}
		if (parent.partAfterArrow.partAfterArrow) {
			// return the first enclosed child between the parent's partAfterArrow and its partAfterArrow
			return parent.partAfterArrow.partAfterArrow.priorChildren.first();
		}
	}
	// no (more) proposition parts, prior's follower is the parent's follower
	return getFollowingPropositionOnSameOrHigherLevel(parent, skipPartAfterArrows);
}

/**
 * Create a plain and immutable copy of the given Pericope.
 * @param {Pericope} pericope - mutable pericope to copy into a plain and immutable representation without circular references
 * @returns {PlainPericope} plain and immutable copy without circular references
 */
export function copyPlainPericope(pericope) {
	const plainPropositions = pericope.text.map(copyPlainProposition).toJS();
	Object.freeze(plainPropositions);
	const plainConnectables = [ ];
	const allPropositions = getFlatText(pericope).cacheResult();
	let referenceProposition = allPropositions.first();
	while (referenceProposition) {
		let topMostConnectable = referenceProposition;
		while (topMostConnectable.superOrdinatedRelation) {
			topMostConnectable = topMostConnectable.superOrdinatedRelation;
		}
		plainConnectables.push(copyPlainConnectableSubtree(topMostConnectable, allPropositions));
		referenceProposition = getFollowingProposition(topMostConnectable, true);
	}
	Object.freeze(plainConnectables);
	const plainPericope = {
		language: pericope.language,
		text: plainPropositions,
		connectables: plainConnectables
	};
	Object.freeze(plainPericope);
	return plainPericope;
}

/**
 * Create a mutable Pericope from the given plain and immutable one.
 * @param {PlainPericope} plainPericope - plain and immutable pericope to copy into its mutable representation
 * @returns {Pericope} mutable representation of the given pericope (including circular references for better mutation performance)
 */
export function copyMutablePericope(plainPericope) {
	const { language, text, connectables } = plainPericope;
	const pericope = new Pericope(text.map(copyMutableProposition), language);
	if (pericope.text.size && connectables && connectables.length) {
		const connectablePropositions = getFlatText(pericope, true).toJS();
		connectables.forEach(singleConnectable => {
			// we don't want any return values, just the implicit setting of superOrdinatedRelation properties
			copyMutableConnectableSubtree(singleConnectable, connectablePropositions);
		});
	}
	return pericope;
}

/**
 * Convert the given mutable Proposition into a plain and immutable object.
 * @param {Propostion} proposition - mutable proposition to copy
 * @returns {PlainProposition} plain and immutable representation of the given proposition
 */
function copyPlainProposition(proposition) {
	const propositionCopy = { };
	if (!proposition.priorChildren.isEmpty()) {
		propositionCopy.priorChildren = proposition.priorChildren.map(copyPlainProposition).toJS();
		Object.freeze(propositionCopy.priorChildren);
	}
	copyPropertyIfNotNull(proposition, propositionCopy, 'label');
	propositionCopy.clauseItems = proposition.clauseItems.map(item => {
		const itemCopy = { originText: item.originText };
		copyPropertyIfNotNull(item, itemCopy, 'syntacticFunction');
		copyPropertyIfNotNull(item, itemCopy, 'comment');
		Object.freeze(itemCopy);
		return itemCopy;
	}).toJS();
	Object.freeze(propositionCopy.clauseItems);
	copyPropertyIfNotNull(proposition, propositionCopy, 'syntacticFunction');
	copyPropertyIfNotNull(proposition, propositionCopy, 'syntacticTranslation');
	copyPropertyIfNotNull(proposition, propositionCopy, 'semanticTranslation');
	copyPropertyIfNotNull(proposition, propositionCopy, 'comment');
	if (!proposition.laterChildren.isEmpty()) {
		propositionCopy.laterChildren = proposition.laterChildren.map(copyPlainProposition).toJS();
		Object.freeze(propositionCopy.laterChildren);
	}
	if (proposition.partAfterArrow) {
		propositionCopy.partAfterArrow = copyPlainProposition(proposition.partAfterArrow);
	}
	Object.freeze(propositionCopy);
	return propositionCopy;
}

/**
 * Make a mutable Proposition copy of the given immutable object.
 * @param {PlainProposition} plainProposition - plain and immutable proposition
 * @returns {Proposition} mutable representation of the given immutable one (including circular references for better mutation performance)
 */
function copyMutableProposition(plainProposition) {
	const clauseItems = plainProposition.clauseItems.map(item => new ClauseItem(item.originText, item.syntacticFunction, item.comment));
	const proposition = new Proposition(clauseItems);
	copyPropertyIfNotNull(plainProposition, proposition, 'label');
	copyPropertyIfNotNull(plainProposition, proposition, 'syntacticFunction');
	copyPropertyIfNotNull(plainProposition, proposition, 'syntacticTranslation');
	copyPropertyIfNotNull(plainProposition, proposition, 'semanticTranslation');
	copyPropertyIfNotNull(plainProposition, proposition, 'comment');
	if (plainProposition.priorChildren) {
		proposition.priorChildren = plainProposition.priorChildren.map(copyMutableProposition);
	}
	if (plainProposition.laterChildren) {
		proposition.laterChildren = plainProposition.laterChildren.map(copyMutableProposition);
	}
	if (plainProposition.partAfterArrow) {
		proposition.partAfterArrow = copyMutableProposition(plainProposition.partAfterArrow);
	}
	return proposition;
}

/**
 * Make a plain copy of the connectable sub tree represented by the given top most item. Apply itself recursively for its associates.
 * @param {Relation|Proposition} connectable - model element to copy as a plain and immutable representation for the connectables subtree
 * @param {Seq.<Proposition>} allPropositions - list of all propositions in origin text order (to determine index of a proposition)
 * @returns {PlainRelation|PlainPropositionPlaceholder} plain and immutable representation of the given model element
 */
function copyPlainConnectableSubtree(connectable, allPropositions) {
	const connectableCopy = { };
	copyPropertyIfNotNull(connectable, connectableCopy, 'role');
	if (connectable instanceof Proposition) {
		connectableCopy.index = allPropositions.findIndex(prop => prop === connectable);
	} else {
		copyPropertyIfNotNull(connectable, connectableCopy, 'comment');
		connectableCopy.associates = connectable.associates.map(associate => copyPlainConnectableSubtree(associate, allPropositions)).toJS();
		Object.freeze(connectableCopy.associates);
	}
	Object.freeze(connectableCopy);
	return connectableCopy;
}

/**
 * Make a mutable Relation copy of the given object or return the next entry from the provided list of Propositions.
 * @param {PlainRelation|PlainPropositionPlaceholder} plainConnectable - immutable model element to get mutable representation for
 * @param {Array.<Propostion>} connectablePropositions - list of connectable Propositions in origin text order (excluding partAfterArrows) - matched propositions are removed from this array
 * @returns {Relation|Proposition} created mutable Relation or looked up mutable Proposition
 */
function copyMutableConnectableSubtree(plainConnectable, connectablePropositions) {
	if (!plainConnectable.associates) {
		// connectable is a proposition, remove it from the beginning of the proposition list and return it
		return connectablePropositions.shift();
	}
	// connectable is a relation, collect associates and create it accordingly
	const associates = plainConnectable.associates.map(associate => copyMutableConnectableSubtree(associate, connectablePropositions));
	const roles = plainConnectable.associates.map(associate => associate.role);
	const relation = new Relation(associates, {
		getAssociateRoles: () => roles
	});
	copyPropertyIfNotNull(plainConnectable, relation, 'comment');
	return relation;
}

/**
 * Copy the property with the given name from the originalObject to the copiedObject if the value in the originalObject is neither undefined, null, or in case of a string empty.
 * @param {object} originalObject - object to copy property value from
 * @param {object} copiedObject - object to copy property value to
 * @param {string} propertyName - name of the property to copy value of
 * @returns {void}
 */
function copyPropertyIfNotNull(originalObject, copiedObject, propertyName) {
	const value = originalObject[propertyName];
	if (value && (typeof value !== 'string' || value.length !== 0)) {
		copiedObject[propertyName] = value;
	}
}
