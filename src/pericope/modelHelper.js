import { List } from 'immutable';

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
 * Under the given pericope or proposition (or one of its partAfterArrows),
 * insert the provided child propostion in front of the specified other subordinated proposition.
 * @param {(Pericope|Proposition)} parent - parent element to add child proposition to
 * @param {Proposition} childToAdd - proposition to subordinate under parent in front of the designated followerProposition
 * @param {Proposition} followerProposition - parent's existing subordinated proposition designated to follow the new child
 * @returns {void}
 */
export function addChildBeforeFollower(parent, childToAdd, followerProposition) {
	const followerMainPart = followerProposition.firstPart;
	const children = parent.getContainingListWithSetter(followerMainPart);
	children.setter(children.list.insert(children.list.indexOf(followerMainPart), childToAdd));
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
	const children = parent.getContainingListWithSetter(priorMainPart);
	children.setter(children.list.insert(children.list.indexOf(priorMainPart) + 1, childToAdd));
	if (!(parent instanceof Proposition)) {
		// clear the now top level proposition's indentation function
		childToAdd.syntacticFunction = null;
	}
}

/**
 * Check whether the given proposition/relation is immediately preceding the given other proposition/relation.
 * @param {Pericope} pericope - overall model for determining the propositions' parents
 * @param {(Relation|Proposition)} reference - leading element
 * @param {(Relation|Proposition)} follower - trailing element
 * @param {boolean} [onlyConnectables=false] - whether to skip over proposition parts that cannot be associated with a relation
 * @returns {boolean} whether no other propositions are between
 */
export function isPriorOf(pericope, reference, follower, onlyConnectables = false) {
	// if the given follower is a relation, retrieve its first contained proposition
	const followerProposition = follower instanceof Proposition ? follower : follower.firstContainedProposition;
	return getFollowingProposition(pericope, reference, onlyConnectables) === followerProposition;
}

/**
 * Find the immediately following proposition of the given proposition/relation in the origin text.
 * @param {Pericope} pericope - overall model for determining the propositions' parents
 * @param {(Relation|Proposition)} reference - prior element
 * @param {boolean} [onlyConnectables=false] - whether to skip over proposition parts that cannot be associated with a relation
 * @returns {?Proposition} next proposition
 */
export function getFollowingProposition(pericope, reference, onlyConnectables = false) {
	// if this is a relation, retrieve the last contained proposition
	const referenceProposition = reference instanceof Proposition ? reference : reference.lastContainedProposition;

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
			return getFollowingPropositionDisregardingPriorsChildren(pericope, referenceProposition, onlyConnectables);
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
 * @param {Pericope} pericope - overall model for determining the propositions' parents
 * @param {Proposition} reference - prior proposition
 * @param {boolean} [onlyConnectables=false] - whether to skip over proposition parts that cannot be associated with a relation
 * @returns {?Proposition} next proposition
 */
function getFollowingPropositionDisregardingPriorsChildren(pericope, reference, onlyConnectables = false) {
	let followingProposition = getFollowingPropositionOnSameOrHigherLevel(pericope, reference, onlyConnectables);
	if (!followingProposition) {
		// reference proposition is the last on this model, i.e. there is no following one
		return null;
	}
	let referenceParent = reference;
	while (!pericope.isParentOf(referenceParent)) {
		const referenceGrandParent = pericope.getDirectParent(referenceParent);
		const children = referenceGrandParent.laterChildren;
		if (children.isEmpty() || referenceParent !== children.last()) {
			break;
		}
		// prior proposition is the last later child of its parent, check parent's parent
		referenceParent = referenceGrandParent;
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
 * @param {Pericope} pericope - overall model for determining the propositions' parents
 * @param {Proposition} priorProposition - reference proposition to find the following proposition for
 * @param {boolean} [skipPartAfterArrows=false] - whether to skip over proposition parts that cannot be associated with a relation
 * @returns {?Proposition} next proposition in origin text
 */
export function getFollowingPropositionOnSameOrHigherLevel(pericope, priorProposition, skipPartAfterArrows = false) {
	if (!skipPartAfterArrows && priorProposition.partAfterArrow) {
		return priorProposition.partAfterArrow;
	}
	const parent = pericope.getDirectParent(priorProposition);
	const referenceProposition = priorProposition.firstPart;
	const siblings = parent.getContainingList(referenceProposition);
	const followingSiblingIndex = siblings.indexOf(referenceProposition) + 1;
	if (followingSiblingIndex < siblings.size) {
		return siblings.get(followingSiblingIndex);
	}
	// priorProposition got no following sibling, check on a higher level
	return getFollowingPropositionOnHigherLevel(pericope, referenceProposition, skipPartAfterArrows);
}

/**
 * Find the following proposition in the origin text, skipping any child or sibling propositions in between.
 * @param {Pericope} pericope - overall model for determining the propositions' parents
 * @param {Proposition} priorProposition - reference proposition to find the following proposition for
 * @param {boolean} [skipPartAfterArrows=false] - whether to skip over proposition parts that cannot be associated with a relation
 * @returns {?Proposition} next proposition in origin text
 */
function getFollowingPropositionOnHigherLevel(pericope, priorProposition, skipPartAfterArrows = false) {
	const parent = pericope.getDirectParent(priorProposition);
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
	return getFollowingPropositionOnSameOrHigherLevel(pericope, parent, skipPartAfterArrows);
}
