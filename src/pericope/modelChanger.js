import { List } from 'immutable';

import { buildPropositionsFromText, addChildAfterPrior, addChildBeforeFollower, removeChild,
		getContainingListInParent, isPriorOf, getFollowingProposition, getFollowingPropositionOnSameOrHigherLevel
} from './modelHelper';
import Proposition from './model/proposition';
import ClauseItem from './model/clauseItem';
import Relation from './model/relation';
import IllegalActionError from './illegalActionError';

/**
 * Subordinate the given target proposition under the specified parent and set its indentation function.
 * This may influence indentations of propositions between the given two (target and parent).
 *
 * @param {Proposition} target - proposition to subordinate under parent
 * @param {Proposition} parent - proposition to subordinate target to
 * @param {SyntacticFunction} syntacticFunction - indentation function to set for target
 * @returns {void}
 */
export function indentPropositionUnderParent(target, parent, syntacticFunction) {
	const oldParent = target.parent;
	// check whether target is already subordinated under parent
	let parentPart = parent;
	do {
		if (oldParent === parent) {
			// subordination is already correct; just update syntacticFunction and we're done here
			target.syntacticFunction = syntacticFunction;
			return;
		}
		parentPart = parentPart.partAfterArrow;
	} while (parentPart);
	if (oldParent === parent.parent) {
		// target and designated parent have the same parent
		const targetSiblings = getContainingListInParent(oldParent, target).value;
		const targetIndex = targetSiblings.indexOf(target);
		const parentIndex = targetSiblings.indexOf(parent);
		if (parentIndex === -1 || Math.abs(targetIndex - parentIndex) !== 1) {
			// target and designated parent cannot be found in the same list or are unconnected
			throw new IllegalActionError('Error.Indentation.Create');
		}
		// target and designated parent are connected siblings (in the same list of children in their common parent)
		removeChild(oldParent, target);
		if (targetIndex < parentIndex) {
			parent.priorChildren = parent.priorChildren.unshift(target);
		} else {
			const lastParentPart = parent.lastPart;
			lastParentPart.laterChildren = lastParentPart.laterChildren.push(target);
		}
	} else {
		// target and designated parent have not the same parent;
		// ensure that the target is not indented to one of its own children
		let grandParent = parent.parent;
		while (grandParent instanceof Proposition) {
			if (grandParent === target) {
				throw new IllegalActionError('Error.Indentation.CreateUnderOwnChild');
			}
			grandParent = grandParent.parent;
		}
		// check if no other propositions exist on same or higher level between target and parent;
		// and find out which one is in front of the other
		parentPart = parent;
		do {
			if (noIntermediatePropositionsOnSameOrHigherLevel(target, parentPart)) {
				removeChild(oldParent, target);
				parentPart.priorChildren = parentPart.priorChildren.push(target);
				break;
			}
			// check also in reverse order
			if (noIntermediatePropositionsOnSameOrHigherLevel(parentPart, target)) {
				if (parentPart.partAfterArrow) {
					// target is behind its new parent; as an enclosed child
					removeChild(oldParent, target);
					parentPart.partAfterArrow.priorChildren = parentPart.partAfterArrow.priorChildren.unshift(target);
				} else {
					// target is behind its new parent no (directly) enclosed child
					removeChild(oldParent, target);
					parentPart.laterChildren = parentPart.laterChildren.unshift(target);
				}
				break;
			}
			parentPart = parentPart.partAfterArrow;
		} while (parentPart);
		if (!parentPart) {
			throw new IllegalActionError('Error.Indentation.Create');
		}
	}
	// structure has been successfully changed, now just update target's indentation function accordingly
	target.syntacticFunction = syntacticFunction;
}

/**
 * Check if the propositions in the given order, have no propositions between them that are on the same or a higher level.
 * This ignores the scenario where both propositions have the same parent or one of the two is the parent (or parent's parent...) of the other.
 *
 * @param {Proposition} propOne - leading proposition to check
 * @param {Propostion} propTwo - trailing proposition to check
 * @return {boolean} whether the given propositions (in that order) have no other propositions between them on the same or a higher level
 */
function noIntermediatePropositionsOnSameOrHigherLevel(propOne, propTwo) {
	// if this is a relation, retrieve the last contained proposition
	let follower = getFollowingPropositionOnSameOrHigherLevel(propOne, false);
	while (follower) {
		if (follower === propTwo) {
			// there are no propositions in between on the same or a higher level
			break;
		}
		const followersPriorChildren = follower.priorChildren;
		// if there is no prior child, the order of the given propositions is incorrect or there is at least one intermediate proposition
		follower = followersPriorChildren.isEmpty() ? null : followersPriorChildren.first();
	}
	return follower !== null;
}

/**
 * Merge the two given propositions, which need to be the same kind of children to the same parent or at least adjacent to oneanother.
 * @param {Proposition} propOne - one proposition to merge with the other
 * @param {Proposition} propTwo - other proposition to merge with the one
 * @returns {void}
 */
export function mergePropositions(propOne, propTwo) {
	if (propOne === propTwo) {
		return;
	}
	const prop1 = propOne.firstPart;
	const prop2 = propTwo.firstPart;
	const parent = prop1.parent;
	if (parent !== prop2.parent) {
		// the propositions have different parents, check if they are adjacent to oneanother
		if (mergePropositionsIfAdjacent(prop1, prop2) || mergePropositionsIfAdjacent(prop2, prop1)) {
			// merged successfully
			return;
		}
		// given propositions are not connected and cannot be merged
		throw new IllegalActionError('Error.MergePropositions');
	}
	const siblings = getContainingListInParent(parent, prop1).value;
	if (!siblings.includes(prop2)) {
		// the propositions are on different sides of their common parent
		throw new IllegalActionError('Error.MergePropositions');
	}
	// propositions have the same parent and are siblings of oneanother; make sure they are in the right order
	const oneBeforeTwo = siblings.indexOf(prop1) < siblings.indexOf(prop2);
	const leadingProposition = oneBeforeTwo ? prop1 : prop2;
	const trailingProposition = oneBeforeTwo ? prop2 : prop1;
	const leadingPropositionsLastPart = leadingProposition.lastPart;
	// delegate merging to appropriate methods
	if (isPriorOf(leadingPropositionsLastPart, trailingProposition)) {
		// no other propositions found between the two targeted ones
		mergeConnectedPropositionAttributes(leadingPropositionsLastPart, trailingProposition);
		removeChild(parent, trailingProposition);
	} else {
		// there are other propositions between the two targeted ones
		mergePropositionsWithEnclosedChildren(leadingProposition, trailingProposition);
	}
}

/**
 * Check whether the two given propositions are adjacent to oneanother. If so merge them together.
 * @param {Proposition} propOne - one proposition to merge with the other
 * @param {Proposition} propTwo - other proposition to merge with the one
 * @returns {boolean} whether the given propositions were adjacent and therefore successfully merged
 */
function mergePropositionsIfAdjacent(propOne, propTwo) {
	// check whether propOne (or one of its partAfterArrows) is the prior of propTwo (or one of its partAfterArrows)
	let propOnePart = propOne;
	let propTwoPart = propTwo;
	while (propOnePart && !isPriorOf(propOnePart, propTwoPart)) {
		// re-check for each partAfterArrow of propTwo
		do {
			propTwoPart = propTwoPart.partAfterArrow;
		} while (propTwoPart && !isPriorOf(propOnePart, propTwoPart));
		if (propTwoPart) {
			// propOnePart is the prior of propTwoPart; get out of this loop and merge them
			break;
		}
		// re-check for next partAfterArrow of propOne and reset propTwo for next iteration
		propOnePart = propOnePart.partAfterArrow;
		propTwoPart = propTwo;
	}
	if (propOnePart) {
		mergeConnectedPropositions(propOnePart, propTwoPart);
		return true;
	}
	return false;
}

/**
 * Merge the two given propositions into the first - assuming they are adjacent without any intermediate propositions.
 * This also takes care of any child propositions and partAfterArrows that need to be moved around.
 * @param {Proposition} propOnePart - (specific part of) one proposition to merge with the other
 * @param {Proposition} propTwoPart - (specific part of) other proposition to merge with the one
 * @returns {void}
 */
function mergeConnectedPropositions(propOnePart, propTwoPart) {
	if (propOnePart === propTwoPart.parent) {
		// propTwo is the leading later child of propOne
		const otherLaterChildren = propOnePart.laterChildren.shift();
		mergeConnectedPropositionAttributes(propOnePart, propTwoPart);
		// reinsert any other later children propOne had before being merged
		propOnePart.laterChildren = List.of(
				...propOnePart.laterChildren,
				...otherLaterChildren);
	} else if (propOnePart.parent === propTwoPart) {
		// propOne is the trailing prior child of propTwo
		// transfer any other prior children of propTwo to the front of propOne's prior children
		propOnePart.priorChildren = List.of(
				...propTwoPart.priorChildren.butLast(),
				...propOnePart.priorChildren);
		if (propTwoPart.partBeforeArrow) {
			// propOne is the last enclosed child but not the only one, transfer propTwo's partBeforeArrow
			propTwoPart.partBeforeArrow.partAfterArrow = propOnePart;
			mergeConnectedPropositionAttributes(propOnePart, propTwoPart);
		} else {
			// move propOne up to propTwo's level within propTwo's parent
			const commonParent = propTwoPart.parent;
			addChildBeforeFollower(commonParent, propOnePart, propTwoPart);
			mergeConnectedPropositionAttributes(propOnePart, propTwoPart);
			removeChild(commonParent, propTwoPart);
		}
	} else {
		// propOne and propTwo are not directly subordinated to oneanother
		const propOnePartAfterArrow = propOnePart.partAfterArrow;
		const propTwoPartBeforeArrow = propTwoPart.partBeforeArrow;
		const propTwoIsSingleEnclosedChild = propOnePartAfterArrow && isPriorOf(propTwoPart, propOnePartAfterArrow);
		mergeConnectedPropositionAttributes(propOnePart, propTwoPart);
		removeChild(propTwoPart.parent, propTwoPart);
		if (propTwoIsSingleEnclosedChild) {
			// propTwo was the last enclosed child, the two parts of propOne should be merged too
			mergeConnectedPropositionAttributes(propOnePart, propOnePartAfterArrow);
		} else if (propOnePartAfterArrow) {
			// add the former partAfterArrow of propOne at the end of the combined proposition;
			// the current value is propTwo's former partAfterArrow
			const lastPartAfterArrow = propOnePart.lastPart;
			lastPartAfterArrow.partAfterArrow = propOnePartAfterArrow;
			if (propOnePartAfterArrow.priorChildren.isEmpty()) {
				// merge these two parts as well, as there are no enclosed children between them
				mergeConnectedPropositionAttributes(lastPartAfterArrow, propOnePartAfterArrow);
			}
		} else if (propTwoPartBeforeArrow) {
			// re-instate the combined proposition as the partAfterArrow instead of the former proptwo,
			// as propOne was an enclosed child that was indented under another enclosed child of propTwo and its partBeforeArrow
			removeChild(propOnePart.parent, propOnePart);
			propOnePart.priorChildren = List.of(
					...propTwoPart.priorChildren,
					...propOnePart.priorChildren);
			propOnePart.syntacticFunction = null;
			propTwoPartBeforeArrow.partAfterArrow = propOnePart;
		}
	}
}

/**
 * Merge the attributes of the two given propositions by appending the second proposition to the first.
 * @param {Proposition} propOne - one proposition to merge with the other
 * @param {Proposition} propTwo - other proposition to merge with the one
 * @returns {void}
 */
function mergeConnectedPropositionAttributes(propOne, propTwo) {
	propOne.clauseItems = List.of(
			...propOne.clauseItems,
			...propTwo.clauseItems);
	if (!propOne.label || propOne.label.length === 0) {
		propOne.label = propTwo.label;
	}
	propOne.syntacticTranslation = joinStrings(propOne.syntacticTranslation, propTwo.syntacticTranslation, ' ');
	propOne.semanticTranslation = joinStrings(propOne.semanticTranslation, propTwo.semanticTranslation, ' ');
	propOne.comment = joinStrings(propOne.comment, propTwo.comment, '\n');
	if (!propOne.syntacticFunction && propOne.parent instanceof Proposition) {
		propOne.syntacticFunction = propTwo.syntacticFunction;
	}
	propOne.laterChildren = propTwo.laterChildren;
	propOne.partAfterArrow = propTwo.partAfterArrow;
	const propTwoRelation = propTwo.superOrdinatedRelation;
	if (!propOne.superOrdinatedRelation && propTwoRelation) {
		propTwoRelation.associates = propTwoRelation.associates.set(propTwoRelation.associates.indexOf(propTwo), propOne);
		propOne.superOrdinatedRelation = propTwoRelation;
		propOne.role = propTwo.role;
	} else if (propTwoRelation) {
		removeRelation(propTwoRelation);
	}
}

/**
 * Merge the two given propositions - assuming there are intermediate propositions that will become enclosed.
 * @param {Proposition} propOnePart - one proposition part to merge with the other
 * @param {Proposition} propTwoPart - other proposition part to merge with the one
 * @returns {void}
 */
function mergePropositionsWithEnclosedChildren(propOnePart, propTwoPart) {
	// make sure the second proposition is in no relation
	if (propTwoPart.superOrdinatedRelation) {
		removeRelation(propTwoPart.superOrdinatedRelation);
	}
	// handle enclosed intermediate propositions on the same level
	const siblings = getContainingListInParent(propOnePart.parent, propOnePart);
	const propOnePartIndex = siblings.value.indexOf(propOnePart);
	const propTwoPartIndex = siblings.value.indexOf(propTwoPart);
	const newEnclosedChildren = siblings.value.slice(propOnePartIndex + 1, propTwoPartIndex);
	// removed enclosed children from the list of siblings
	siblings.value = List.of(
			...siblings.value.slice(0, propOnePartIndex + 1),
			...siblings.value.slice(propTwoPartIndex));
	// subordinate enclosed propositions to secondPart
	propTwoPart.priorChildren = List.of(
			...newEnclosedChildren,
			...propTwoPart.priorChildren);
	const lastPropOnePart = propOnePart.lastPart;
	// a partBeforeArrow shouldn't have any laterChildren, only the respective partAfterArrow should have priorChildren
	if (!lastPropOnePart.laterChildren.isEmpty()) {
		propTwoPart.priorChildren = List.of(
				...lastPropOnePart.laterChildren,
				...propTwoPart.priorChildren);
		lastPropOnePart.laterChildren = List();
	}
	// remove propTwoPart as independent proposition and make it the propOnePart's last partAfterArrow
	removeChild(propOnePart.parent, propTwoPart);
	lastPropOnePart.partAfterArrow = propTwoPart;
	// a partAfterArrow cannot have an own identation function
	propTwoPart.syntacticFunction = null;
}

/**
 * Make the given proposition a sibling of its current parent, i.e. un-subordinate it once.
 * @param {Proposition} proposition - proposition to move up to the same level as its parent
 * @returns {void}
 * @throws {IllegalActionError} proposition is a top level propositions or a directly enclosed child
 * @see removeOneIndentationAffectsOthers()
 */
export function removeOneIndentation(proposition) {
	if (!(proposition.parent instanceof Proposition)) {
		throw new IllegalActionError('Error.Indentation.Remove.PericopeReached');
	}
	const parentFirstPart = proposition.parent.firstPart;
	const parentLastPart = parentFirstPart.lastPart;
	const grandParent = parentFirstPart.parent;
	if (parentFirstPart.priorChildren.includes(proposition)) {
		const targetIndex = parentFirstPart.priorChildren.indexOf(proposition);
		parentFirstPart.priorChildren.slice(0, targetIndex + 1).forEach(sibling => {
			// remove indentation for all preceeding siblings and the targeted one
			removeChild(parentFirstPart, sibling);
			addChildBeforeFollower(grandParent, sibling, parentFirstPart);
		});
	} else if (parentLastPart.laterChildren.includes(proposition)) {
		const targetIndex = parentLastPart.laterChildren.indexOf(proposition);
		parentLastPart.laterChildren.slice(targetIndex).reverse().forEach(sibling => {
			// remove indentation for all following siblings and the targeted one
			removeChild(parentLastPart, sibling);
			addChildAfterPrior(grandParent, sibling, parentFirstPart);
		});
	} else {
		// targeted proposition is a directly enclosed child
		throw new IllegalActionError('Error.Indentation.Remove.Enclosed');
	}
}

/**
 * Check whether making the given proposition a sibling of its current parent would require other child propositions of its parent to be un-subordinated.
 * @param {Proposition} proposition - proposition to move up to the same level as its parent
 * @returns {boolean} whether other propositions would need to be un-indented
 * @throws {IllegalActionError} proposition is a top level propositions or a directly enclosed child
 */
export function removeOneIndentationAffectsOthers(proposition) {
	if (!(proposition.parent instanceof Proposition)) {
		throw new IllegalActionError('Error.Indentation.Remove.PericopeReached');
	}
	const parentFirstPart = proposition.parent.firstPart;
	const parentLastPart = parentFirstPart.lastPart;
	if (parentFirstPart.priorChildren.includes(proposition)) {
		return parentFirstPart.priorChildren.first() !== proposition;
	}
	if (parentLastPart.laterChildren.includes(proposition)) {
		return parentLastPart.laterChildren.last() !== proposition;
	}
	// targeted proposition is a directly enclosed child
	throw new IllegalActionError('Error.Indentation.Remove.Enclosed');
}

/**
 * Split the selected proposition after the designated clause item and remove all relations that will become invalid by this change.
 * @param {Proposition} proposition - proposition two split into two independent ones
 * @param {ClauseItem} lastItemInFirstPart - last clause item after which to split the proposition
 * @returns {void}
 * @throws {IllegalActionError}
 */
export function splitProposition(proposition, lastItemInFirstPart) {
	const lastItemIndex = proposition.clauseItems.indexOf(lastItemInFirstPart);
	if (lastItemIndex === -1) {
		throw new Error('Could not find given clause item in designated proposition.');
	}
	if (lastItemIndex + 1 < proposition.clauseItems.size) {
		const secondPartItems = proposition.clauseItems.slice(lastItemIndex + 1);
		// removes the duplicates of the secondPart from the firstPart
		proposition.clauseItems = proposition.clauseItems.slice(0, lastItemIndex + 1);
		// transfer original proposition's later children to the new one
		const secondPart = new Proposition(secondPartItems);
		secondPart.laterChildren = proposition.laterChildren;
		proposition.laterChildren = List();
		// avoid gaps in super ordinated relations
		let affectedConnectable = proposition;
		while (affectedConnectable.superOrdinatedRelation) {
			const superOrdinatedRelation = affectedConnectable.superOrdinatedRelation;
			if (superOrdinatedRelation.associates.last() === affectedConnectable) {
				affectedConnectable = superOrdinatedRelation;
			} else {
				// targeted proposition is not the last associate in one of its super ordinated relations;
				// remove it as it would become invalid by splitting the targeted proposition
				removeRelation(superOrdinatedRelation);
				break;
			}
		}
		// transfer partAfterArrow
		const partAfterArrow = proposition.partAfterArrow;
		proposition.partAfterArrow = null;
		secondPart.partAfterArrow = partAfterArrow;
		// insert new proposition
		addChildAfterPrior(proposition.parent, secondPart, proposition);
	} else if (proposition.partAfterArrow) {
		resetStandaloneStateOfPartAfterArrow(proposition.partAfterArrow);
	} else {
		throw new IllegalActionError('Error.SplitProposition');
	}
}

/**
 * Restore the standalone state of the given proposition part.
 * @param {Proposition} partAfterArrow - proposition part to revert into connectable proposition
 * @returns {void}
 */
export function resetStandaloneStateOfPartAfterArrow(partAfterArrow) {
	const partBeforeArrow = partAfterArrow.partBeforeArrow;
	// the split position is the end of one proposition part;
	// execute split by reseting the part after arrow's standalone state
	let affectedConnectable = getFollowingProposition(partAfterArrow, true);
	if (affectedConnectable) {
		while (affectedConnectable.superOrdinatedRelation) {
			const superOrdinatedRelation = affectedConnectable.superOrdinatedRelation;
			if (affectedConnectable === superOrdinatedRelation.associates.first()) {
				affectedConnectable = superOrdinatedRelation;
			} else {
				// follower is not the first associate in one of its super ordinated relations;
				// remove it as it would become invalid by splitting the targeted proposition
				removeRelation(superOrdinatedRelation);
				break;
			}
		}
	}
	partBeforeArrow.partAfterArrow = null;
	addChildAfterPrior(partBeforeArrow.parent, partAfterArrow, partBeforeArrow);
}

/**
 * Merge the given clause item with its preceeding clause item.
 * @param {Proposition} parent - proposition containing the two clause items to merge
 * @param {ClauseItem} itemToMerge - trailing clause item to merge
 * @returns {void}
 * @throws {IllegalActionError} no preceeding clause item found
 */
export function mergeClauseItemWithPrior(parent, itemToMerge) {
	const items = parent.clauseItems;
	const itemIndex = items.indexOf(itemToMerge);
	if (itemIndex > 0) {
		mergeClauseItems(parent, items.get(itemIndex - 1), itemToMerge);
	} else {
		throw new IllegalActionError('Error.MergeClauseItems.NoPrior');
	}
}

/**
 * Merge the given clause item with its following clause item.
 * @param {Proposition} parent - proposition containing the two clause items to merge
 * @param {ClauseItem} itemToMerge - leading clause item to merge
 * @returns {void}
 * @throws {IllegalActionError} no following clause item found
 */
export function mergeClauseItemWithFollower(parent, itemToMerge) {
	const items = parent.clauseItems;
	const itemIndex = items.indexOf(itemToMerge);
	if (itemIndex > -1 && itemIndex + 1 < items.size) {
		mergeClauseItems(parent, itemToMerge, items.get(itemIndex + 1));
	} else {
		throw new IllegalActionError('Error.MergeClauseItems.NoFollower');
	}
}

/**
 * Merge the given two clause items into the first one and remove the second one afterwards.
 * @param {Proposition} parent - proposition containing the two clause items to merge
 * @param {ClauseItem} itemOne - leading clause item to merge
 * @param {ClauseItem} itemTwo - trailing clause item to merge
 * @returns {void}
 */
function mergeClauseItems(parent, itemOne, itemTwo) {
	itemOne.originText = joinStrings(itemOne.originText, itemTwo.originText, ' ');
	if (!itemOne.syntacticFunction) {
		itemOne.syntacticFunction = itemTwo.syntacticFunction;
	}
	parent.clauseItems = parent.clauseItems.remove(parent.clauseItems.indexOf(itemTwo));
}

/**
 * Split the given clause item after the specified origin text part.
 * @param {Proposition} parent - proposition containing the clause item to split
 * @param {ClauseItem} itemToSplit - clause item to split into two
 * @param {string} firstOriginTextPart - leading part of the origin text after which to split the clause item into two
 * @returns {void}
 */
export function splitClauseItem(parent, itemToSplit, firstOriginTextPart) {
	if (!firstOriginTextPart || !itemToSplit.originText.startsWith(firstOriginTextPart) || itemToSplit.originText === firstOriginTextPart) {
		throw new Error('Illegal originText part provided');
	}
	const remainingOriginText = itemToSplit.originText.substring(firstOriginTextPart.length).trim();
	const itemToAppend = new ClauseItem(remainingOriginText);
	itemToSplit.originText = firstOriginTextPart.trim();
	parent.clauseItems = parent.clauseItems.insert(parent.clauseItems.indexOf(itemToSplit) + 1, itemToAppend);
}

/**
 * Create a relation over the given associates by setting their roles and weights according to the specified template.
 * @param {List.<(Relation|Propostion)>|Array.<(Relation|Proposition)>} associates - elements to combine under new super ordinated relation
 * @param {RelationTemplate} template - definition of applicable roles and weights of the associates in the new relation
 * @returns {Relation} created relation over the given associates
 */
export function createRelation(associates, template) {
	const associateList = List(associates);
	// no associate is allowed to have a super ordinated relation
	if (associateList.some(associate => associate.superOrdinatedRelation)) {
		throw new IllegalActionError('Error.CreateRelation.NotConnected');
	}
	// ensure associates are in correct order and immediately adjacent to oneanother (ignoring partAfterArrows)
	if (associateList.butLast().every((reference, index) => isPriorOf(reference, associateList.get(index + 1), true))) {
		return new Relation(associates, template);
	}
	throw new IllegalActionError('Error.CreateRelation.NotConnected');
}

/**
 * Rotate the roles (with their weights) between all associates of the given relation, by one step from top to bottom.
 * @param {Relation} relation - relation in which to rotate all associates' roles
 * @returns {void}
 */
export function rotateAssociateRoles(relation) {
	let priorRole = relation.associates.first().role;
	relation.associates.shift().forEach(associate => {
		const oldRole = associate.role;
		associate.role = priorRole;
		priorRole = oldRole;
	});
	relation.associates.first().role = priorRole;
}

/**
 * Change the given relations type according to the specified template.
 * @param {Relation} relation - relation to change the type of
 * @param {RelationTempate} template - new relation type to apply
 * @returns {void}
 */
export function alterRelationType(relation, template) {
	const roles = template.getAssociateRoles(relation.associates.size);
	relation.associates.forEach((associate, index) => {
		associate.role = roles.get(index);
	});
}

/**
 * Add the specified origin text as new propositions in front of the existing ones on the given pericope.
 * @param {Pericope} pericope - pericope to prepend origin text to
 * @param {string} originText - origin text to prepend
 * @returns {void}
 */
export function prependText(pericope, originText) {
	pericope.text = List.of(
			...buildPropositionsFromText(originText),
			...pericope.text);
}

/**
 * Add the specified origin text as new propositions behind the existing ones on the given pericope.
 * @param {Pericope} pericope - pericope to append origin text to
 * @param {string} originText - origin text to append
 * @returns {void}
 */
export function appendText(pericope, originText) {
	pericope.text = List.of(
			...pericope.text,
			...buildPropositionsFromText(originText));
}

/**
 * Remove the specified propositions and their super ordinated relations from the given pericope.
 * Propositions must not be subordinated to other ones and have no child Propositions of their own.
 * @param {Pericope} pericope - pericope to remove given propositions from
 * @param {List.<Propostion>|Array.<Proposition>} propositionsToRemove - propositions to remove from pericope
 * @returns {void}
 */
export function removePropositions(pericope, propositionsToRemove) {
	const propositions = List(propositionsToRemove);
	if (propositions.isEmpty()) {
		throw new IllegalActionError('Error.DeletePropositions.NoneSelected');
	}
	if (propositions.some(proposition =>
		proposition.parent instanceof Proposition || proposition.partAfterArrow || !proposition.priorChildren.isEmpty() || !proposition.laterChildren.isEmpty())) {
		throw new IllegalActionError('Error.DeletePropositions.ConditionsNotMet');
	}
	if (propositions.size === pericope.text.size) {
		throw new IllegalActionError('Error.DeletePropositions.AllSelected');
	}
	propositions.forEach(proposition => {
		if (proposition.superOrdinatedRelation) {
			removeRelation(proposition.superOrdinatedRelation);
		}
		removeChild(pericope, proposition);
	});
}

/**
 * Remove the given relation and all super ordinated relations, thereby also cleaning up any back references from its associates.
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
 * Utility method for a null/empty-aware joining of two strings with the given separator in between.
 * @param {?string} textOne - first string to combine with the second one
 * @param {?string} textTwo - second string to combine with the first one
 * @param {string} separator - separator to insert between the other two string (only if they are both neither null nor empty)
 * @returns {string|null} joined string (or the non-null/non-empty one of the two)
 */
function joinStrings(textOne, textTwo, separator) {
	if (!textOne || textOne.length === 0) {
		return textTwo;
	}
	if (!textTwo || textTwo.length === 0) {
		return textOne;
	}
	return textOne.concat(separator, textTwo);
}
