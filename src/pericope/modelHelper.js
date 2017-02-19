import { Map, List, Seq } from 'immutable';
import PropertyAccessor from './propertyAccessor';
import Proposition from './model/proposition';
import ClauseItem from './model/clauseItem';

/**
 * Construct the representing propositions from the given text.
 * Each line in the given text will be represented by a single proposition.
 * Within a proposition each token separated by a tab ('\t') or by 4+ whitespaces will become a clause item.
 *
 * @param {string} originText - the origin text to be converted to a list of propositions
 * @returns {List<Proposition>} propositions extracted from text
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
 * Build a flat list of all propositions (including partAfterArrows) contained in the given pericope in the origin text order.
 * @param {Pericope} pericope - pericope for which to construct the flattened proposition list
 * @returns {Seq<Proposition>} all contained propositions in the origin text order
 */
export function getFlatText(pericope) {
	// use a lazy Seq in order to avoid having to build the whole model as flat list if not necessary
	return Seq(pericope.text).flatMap(flattenProposition);
}

/**
 * Build a flat list of the given proposition and all its subordinated child propositions (including their partAfterArrows) in the origin text order.
 * @param {Proposition} proposition - proposition to build flat sequence representing its hierarchical structure for
 * @returns {Seq<Proposition>} flat representation of the proposition's subtree
 */
function flattenProposition(proposition) {
	// use lazy Seqs in order to avoid having to build the whole model as flat list if not necessary
	return Seq(proposition.priorChildren).flatMap(flattenProposition).concat(
			proposition,
			Seq(proposition.laterChildren).flatMap(flattenProposition),
			proposition.partAfterArrow ? flattenProposition(proposition.partAfterArrow) : List()
			);
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
 * Under the given pericope or proposition (or one of its partAfterArrows),
 * insert the provided child propostion after the specified other subordinated proposition.
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
 * Destroy the given relation and all super ordinated relations, thereby also cleaning up any back references from its associates.
 * @param {Relation} relation - relation to remove
 * @returns {void}
 */
export function removeRelation(relation) {
	let superOrdinatedRelation = relation;
	do {
		// reset subordinated relations/propositions to belong to no relation
		superOrdinatedRelation.associates.forEach(associate => {
			associate.superOrdinatedRelation = null;
			associate.role = null;
		});
		superOrdinatedRelation = superOrdinatedRelation.superOrdinatedRelation;
	} while (superOrdinatedRelation);
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
 * @returns {?Proposition} next proposition
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
 * @returns {?Proposition} next proposition
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
 * @returns {?Proposition} next proposition in origin text
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
 * @returns {?Proposition} next proposition in origin text
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
