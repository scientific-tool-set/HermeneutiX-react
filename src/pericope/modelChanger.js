import _ from 'lodash';
import { addChildAfterPrior, addChildBeforeFollower, isPriorOf, getFollowingProposition, getFollowingPropositionOnSameOrHigherLevel, buildPropositionsFromText } from './modelHelper';
import Proposition from './model/proposition';
import ClauseItem from './model/clauseItem';
import Relation from './model/relation';
import IllegalActionError from './IllegalActionError';

/**
 * Subordinate the given target proposition under the specified parent and set its indentation function.
 * This may influence indentations of propositions between the given two (target and parent).
 *
 * @param {Proposition} target - proposition to subordinate under parent
 * @param {Proposition} parent - proposition to subordinate target to
 * @param {SyntacticFunction} syntacticFunction - indentation function to set for target
 * @returns {void}
 */
export const indentPropositionUnderParent = function(target, parent, syntacticFunction) {
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
		const targetSiblings = oldParent.getContainingList(target);
		const targetIndex = _.indexOf(targetSiblings, target);
		const parentIndex = _.indexOf(targetSiblings, parent);
		if (parentIndex === -1 || Math.abs(targetIndex - parentIndex) !== 1) {
			// target and designated parent cannot be found in the same list or are unconnected
			throw new IllegalActionError('Error.Indentation.Create');
		}
		// target and designated parent are connected siblings (in the same list of children in their common parent)
		oldParent.removeChild(target);
		if (targetIndex < parentIndex) {
			parent.addLeadingPriorChild(target);
		} else {
			parent.lastPart.addTrailingLaterChild(target);
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
				oldParent.removeChild(target);
				parentPart.addTrailingPriorChild(target);
				break;
			}
			// check also in reverse order
			if (noIntermediatePropositionsOnSameOrHigherLevel(parentPart, target)) {
				if (parentPart.partAfterArrow) {
					// target is behind its new parent; as an enclosed child
					oldParent.removeChild(target);
					parentPart.partAfterArrow.addLeadingPriorChild(target);
				} else {
					// target is behind its new parent no (directly) enclosed child
					oldParent.removeChild(target);
					parentPart.addLeadingLaterChild(target);
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
};

/**
 * Check if the propositions in the given order, have no propositions between them that are on the same or a higher level.
 * This ignores the scenario where both propositions have the same parent or one of the two is the parent (or parent's parent...) of the other.
 *
 * @param {Proposition} propOne - leading proposition to check
 * @param {Propostion} propTwo - trailing proposition to check
 * @return {boolean} whether the given propositions (in that order) have no other propositions between them on the same or a higher level
 */
const noIntermediatePropositionsOnSameOrHigherLevel = function(propOne, propTwo) {
	// if this is a relation, retrieve the last contained proposition
	let follower = getFollowingPropositionOnSameOrHigherLevel(propOne, false);
	while (follower) {
		if (follower === propTwo) {
			// there are no propositions in between on the same or a higher level
			break;
		}
		const followersPriorChildren = follower.priorChildren;
		// if there is no prior child, the order of the given propositions is incorrect or there is at least one intermediate proposition
		follower = followersPriorChildren.length === 0 ? null : followersPriorChildren[0];
	}
	return follower !== null;
};

/**
 * Merge the two given propositions, which need to be the same kind of children to the same parent or at least adjacent to oneanother.
 * @param {Proposition} propOne - one proposition to merge with the other
 * @param {Proposition} propTwo - other proposition to merge with the one
 * @returns {void}
 */
export const mergePropositions = function(propOne, propTwo) {
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
	const siblings = parent.getContainingList(prop1);
	if (!_.includes(siblings, prop2)) {
		// the propositions are on different sides of their common parent
		throw new IllegalActionError('Error.MergePropositions');
	}
	// propositions have the same parent and are siblings of oneanother; make sure they are in the right order
	const oneBeforeTwo = _.indexOf(siblings, prop1) < _.indexOf(siblings, prop2);
	const leadingProposition = oneBeforeTwo ? prop1 : prop2;
	const trailingProposition = oneBeforeTwo ? prop2 : prop1;
	const leadingPropositionsLastPart = leadingProposition.lastPart;
	// delegate merging to appropriate methods
	if (isPriorOf(leadingPropositionsLastPart, trailingProposition)) {
		// no other propositions found between the two targeted ones
		mergeConnectedPropositionAttributes(leadingPropositionsLastPart, trailingProposition);
		parent.removeChild(trailingProposition);
	} else {
		// there are other propositions between the two targeted ones
		mergePropositionsWithEnclosedChildren(leadingProposition, trailingProposition);
	}
};

/**
 * Check whether the two given propositions are adjacent to oneanother. If so merge them together.
 * @param {Proposition} propOne - one proposition to merge with the other
 * @param {Proposition} propTwo - other proposition to merge with the one
 * @returns {boolean} whether the given propositions were adjacent and therefore successfully merged
 */
const mergePropositionsIfAdjacent = function(propOne, propTwo) {
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
};

/**
 * Merge the two given propositions into the first - assuming they are adjacent without any intermediate propositions.
 * This also takes care of any child propositions and partAfterArrows that need to be moved around.
 * @param {Proposition} propOnePart - (specific part of) one proposition to merge with the other
 * @param {Proposition} propTwoPart - (specific part of) other proposition to merge with the one
 * @returns {void}
 */
const mergeConnectedPropositions = function(propOnePart, propTwoPart) {
	if (propOnePart === propTwoPart.parent) {
		// propTwo is the leading later child of propOne
		const otherLaterChildren = propOnePart.laterChildren.slice(1);
		mergeConnectedPropositionAttributes(propOnePart, propTwoPart);
		// reinsert any other later children propOne had before being merged
		_.forEach(otherLaterChildren, child => {
			propOnePart.addTrailingLaterChild(child);
		});
	} else if (propOnePart.parent === propTwoPart) {
		// propOne is the trailing prior child of propTwo
		// transfer any other prior children of propTwo to the front of propOne's prior children
		_.forEachRight(propTwoPart.priorChildren.slice(0, -1), child => {
			propOnePart.addLeadingPriorChild(child);
		});
		if (propTwoPart.partBeforeArrow) {
			// propOne is the last enclosed child but not the only one, transfer propTwo's partBeforeArrow
			propTwoPart.partBeforeArrow.partAfterArrow = propOnePart;
			mergeConnectedPropositionAttributes(propOnePart, propTwoPart);
		} else {
			// move propOne up to propTwo's level within propTwo's parent
			const commonParent = propTwoPart.parent;
			addChildBeforeFollower(commonParent, propOnePart, propTwoPart);
			mergeConnectedPropositionAttributes(propOnePart, propTwoPart);
			commonParent.removeChild(propTwoPart);
		}
	} else {
		// propOne and propTwo are not directly subordinated to oneanother
		const propOnePartAfterArrow = propOnePart.partAfterArrow;
		const propTwoPartBeforeArrow = propTwoPart.partBeforeArrow;
		const propTwoIsSingleEnclosedChild = propOnePartAfterArrow && isPriorOf(propTwoPart, propOnePartAfterArrow);
		mergeConnectedPropositionAttributes(propOnePart, propTwoPart);
		propTwoPart.parent.removeChild(propTwoPart);
		if (propTwoIsSingleEnclosedChild) {
			// propTwo was the last enclosed child, the two parts of propOne should be merged too
			mergeConnectedPropositionAttributes(propOnePart, propOnePartAfterArrow);
		} else if (propOnePartAfterArrow) {
			// add the former partAfterArrow of propOne at the end of the combined proposition;
			// the current value is propTwo's former partAfterArrow
			const lastPartAfterArrow = propOnePart.lastPart;
			lastPartAfterArrow.partAfterArrow = propOnePartAfterArrow;
			if (propOnePartAfterArrow.priorChildren.length === 0) {
				// merge these two parts as well, as there are no enclosed children between them
				mergeConnectedPropositionAttributes(lastPartAfterArrow, propOnePartAfterArrow);
			}
		} else if (propTwoPartBeforeArrow) {
			// re-instate the combined proposition as the partAfterArrow instead of the former proptwo,
			// as propOne was an enclosed child that was indented under another enclosed child of propTwo and its partBeforeArrow
			propOnePart.parent.removeChild(propOnePart);
			propOnePart.priorChildren = propTwoPart.priorChildren.concat(propOnePart.priorChildren);
			propOnePart.syntacticFunction = null;
			propTwoPartBeforeArrow.partAfterArrow = propOnePart;
		}
	}
};

/**
 * Merge the attributes of the two given propositions by appending the second proposition to the first.
 * @param {Proposition} propOne - one proposition to merge with the other
 * @param {Proposition} propTwo - other proposition to merge with the one
 * @returns {void}
 */
const mergeConnectedPropositionAttributes = function(propOne, propTwo) {
	propOne.clauseItems = propOne.clauseItems.concat(propTwo.clauseItems);
	if (!propOne.label || propOne.label.length === 0) {
		propOne.label = propTwo.label;
	}
	propOne.syntacticTranslation = joinStrings(propOne.syntacticTranslation, propTwo.syntacticTranslation, ' ');
	propOne.semanticTranslation = joinStrings(propOne.semanticTranslation, propTwo.semanticTranslation, ' ');
	propOne.comment = joinStrings(propOne.comment, propTwo.comment, '\n');
	if (propOne.syntacticFunction === null && propOne.parent instanceof Proposition) {
		propOne.syntacticFunction = propTwo.syntacticFunction;
	}
	propOne.laterChildren = propTwo.laterChildren;
	propOne.partAfterArrow = propTwo.partAfterArrow;
	const propTwoRelation = propTwo.superOrdinatedRelation;
	if (!propOne.superOrdinatedRelation && propTwoRelation) {
		propTwoRelation.associates[_.indexOf(propTwoRelation.associates, propTwo)] = propOne;
		propOne.superOrdinatedRelation = propTwoRelation;
		propOne.role = propTwo.role;
	} else if (propTwoRelation) {
		propTwoRelation.kill();
	}
};

/**
 * Merge the two given propositions - assuming there are intermediate propositions that will become enclosed.
 * @param {Proposition} propOnePart - one proposition part to merge with the other
 * @param {Proposition} propTwoPart - other proposition part to merge with the one
 * @returns {void}
 */
const mergePropositionsWithEnclosedChildren = function(propOnePart, propTwoPart) {
	// make sure the second proposition is in no relation
	if (propTwoPart.superOrdinatedRelation) {
		propTwoPart.superOrdinatedRelation.kill();
	}
	// handle enclosed intermediate propositions on the same level
	let siblings = propOnePart.parent.getContainingList(propOnePart);
	siblings = siblings.slice(_.indexOf(siblings, propOnePart) + 1, _.indexOf(siblings, propTwoPart));
	// subordinate enclosed propositions to secondPart
	_.forEachRight(siblings, toTransfer => {
		propOnePart.parent.removeChild(toTransfer);
		propTwoPart.addLeadingPriorChild(toTransfer);
	});
	const lastPropOnePart = propOnePart.lastPart;
	// a partBeforeArrow shouldn't have any laterChildren, only the respective partAfterArrow should have priorChildren
	if (lastPropOnePart.laterChildren.length > 0) {
		propTwoPart.priorChildren = lastPropOnePart.laterChildren.concat(propTwoPart.priorChildren);
		lastPropOnePart.laterChildren = [ ];
	}
	// remove propTwoPart as independent proposition and make it the propOnePart's last partAfterArrow
	propOnePart.parent.removeChild(propTwoPart);
	lastPropOnePart.partAfterArrow = propTwoPart;
	// a partAfterArrow cannot have an own identation function
	propTwoPart.syntacticFunction = null;
};

/**
 * Make the given proposition a sibling of its current parent, i.e. un-subordinate it once.
 * @param {Proposition} proposition - proposition to move up to the same level as its parent
 * @returns {void}
 * @throws {IllegalActionError} proposition is a top level propositions or a directly enclosed child
 * @see removeOneIndentationAffectsOthers()
 */
export const removeOneIndentation = function(proposition) {
	if (!(proposition.parent instanceof Proposition)) {
		throw new IllegalActionError('Error.Indentation.Remove.PericopeReached');
	}
	const parentFirstPart = proposition.parent.firstPart;
	const parentLastPart = parentFirstPart.lastPart;
	const grandParent = parentFirstPart.parent;
	if (_.includes(parentFirstPart.priorChildren, proposition)) {
		const targetIndex = _.indexOf(parentFirstPart.priorChildren, proposition);
		_.forEach(parentFirstPart.priorChildren.slice(0, targetIndex + 1), sibling => {
			// remove indentation for all preceeding siblings and the targeted one
			parentFirstPart.removeChild(sibling);
			addChildBeforeFollower(grandParent, sibling, parentFirstPart);
		});
	} else if (_.includes(parentLastPart.laterChildren, proposition)) {
		const targetIndex = _.indexOf(parentLastPart.laterChildren, proposition);
		_.forEachRight(parentLastPart.laterChildren.slice(targetIndex), sibling => {
			// remove indentation for all following siblings and the targeted one
			parentLastPart.removeChild(sibling);
			addChildAfterPrior(grandParent, sibling, parentFirstPart);
		});
	} else {
		// targeted proposition is a directly enclosed child
		throw new IllegalActionError('Error.Indentation.Remove.Enclosed');
	}
};

/**
 * Check whether making the given proposition a sibling of its current parent
 * would require other child propositions of its parent to be un-subordinated.
 * @param {Proposition} proposition - proposition to move up to the same level as its parent
 * @returns {boolean} whether other propositions would need to be un-indented
 * @throws {IllegalActionError} proposition is a top level propositions or a directly enclosed child
 */
export const removeOneIndentationAffectsOthers = function(proposition) {
	if (!(proposition.parent instanceof Proposition)) {
		throw new IllegalActionError('Error.Indentation.Remove.PericopeReached');
	}
	const parentFirstPart = proposition.parent.firstPart;
	const parentLastPart = parentFirstPart.lastPart;
	if (_.includes(parentFirstPart.priorChildren, proposition)) {
		return _.indexOf(parentFirstPart.priorChildren, proposition) !== 0;
	}
	if (_.includes(parentLastPart.laterChildren, proposition)) {
		return _.indexOf(parentLastPart.laterChildren, proposition) !== parentLastPart.laterChildren.length - 1;
	}
	// targeted proposition is a directly enclosed child
	throw new IllegalActionError('Error.Indentation.Remove.Enclosed');
};

/**
 * Split the selected proposition after the designated clause item and
 * remove all relations that will become invalid by this change.
 * @param {Proposition} proposition - proposition two split into two independent ones
 * @param {ClauseItem} lastItemInFirstPart - last clause item after which to split the proposition
 * @returns {void}
 * @throws {IllegalActionError}
 */
export const splitProposition = function(proposition, lastItemInFirstPart) {
	const firstPartItems = proposition.clauseItems;
	const lastItemIndex = _.indexOf(firstPartItems, lastItemInFirstPart);
	if (lastItemIndex === -1) {
		throw new Error('Could not find given clause item in designated proposition.');
	}
	if (lastItemIndex + 1 < firstPartItems.length) {
		const secondPartItems = firstPartItems.slice(lastItemIndex + 1);
		// removes the duplicates of the secondPart from the firstPart
		proposition.removeClauseItems(secondPartItems);
		// transfer original proposition's later children to the new one
		const secondPart = new Proposition(secondPartItems, proposition.parent);
		secondPart.laterChildren = proposition.laterChildren;
		proposition.laterChildren = [ ];
		// avoid gaps in super ordinated relations
		let affectedConnectable = proposition;
		while (affectedConnectable.superOrdinatedRelation) {
			const superOrdinatedRelation = affectedConnectable.superOrdinatedRelation;
			const associates = superOrdinatedRelation.associates;
			if (affectedConnectable === associates[associates.length - 1]) {
				affectedConnectable = superOrdinatedRelation;
			} else {
				// targeted proposition is not the last associate in one of its super ordinated relations;
				// remove it as it would become invalid by splitting the targeted proposition
				superOrdinatedRelation.kill();
				break;
			}
		}
		// transfer partAfterArrow
		secondPart.partAfterArrow = proposition.partAfterArrow;
		proposition.partAfterArrow = null;
		// insert new proposition
		addChildAfterPrior(proposition.parent, secondPart, proposition);
	} else if (proposition.partAfterArrow) {
		resetStandaloneStateOfPartAfterArrow(proposition.partAfterArrow);
	} else {
		throw new IllegalActionError('Error.SplitProposition');
	}
};

/**
 * Restore the standalone state of the given proposition part.
 * @param {Proposition} partAfterArrow - proposition part to revert into connectable proposition
 * @returns {void}
 */
export const resetStandaloneStateOfPartAfterArrow = function(partAfterArrow) {
	const partBeforeArrow = partAfterArrow.partBeforeArrow;
	// the split position is the end of one proposition part;
	// execute split by reseting the part after arrow's standalone state
	let affectedConnectable = getFollowingProposition(partAfterArrow, true);
	if (affectedConnectable) {
		while (affectedConnectable.superOrdinatedRelation) {
			const superOrdinatedRelation = affectedConnectable.superOrdinatedRelation;
			if (affectedConnectable === superOrdinatedRelation.associates[0]) {
				affectedConnectable = superOrdinatedRelation;
			} else {
				// follower is not the first associate in one of its super ordinated relations;
				// remove it as it would become invalid by splitting the targeted proposition
				superOrdinatedRelation.kill();
				break;
			}
		}
	}
	partBeforeArrow.partAfterArrow = null;
	addChildAfterPrior(partBeforeArrow.parent, partAfterArrow, partBeforeArrow);
};

/**
 * Merge the given clause item with its preceeding clause item.
 * @param {ClauseItem} itemToMerge - trailing clause item to merge
 * @returns {void}
 * @throws {IllegalActionError} no preceeding clause item found
 */
export const mergeClauseItemWithPrior = function(itemToMerge) {
	const items = itemToMerge.parent.clauseItems;
	const itemIndex = _.indexOf(items, itemToMerge);
	if (itemIndex > 0) {
		mergeClauseItems(items[itemIndex - 1], itemToMerge);
	} else {
		throw new IllegalActionError('Error.MergeClauseItems.NoPrior');
	}
};

/**
 * Merge the given clause item with its following clause item.
 * @param {ClauseItem} itemToMerge - leading clause item to merge
 * @returns {void}
 * @throws {IllegalActionError} no following clause item found
 */
export const mergeClauseItemWithFollower = function(itemToMerge) {
	const items = itemToMerge.parent.clauseItems;
	const itemIndex = _.indexOf(items, itemToMerge);
	if (itemIndex > -1 && itemIndex + 1 < items.length) {
		mergeClauseItems(itemToMerge, items[itemIndex + 1]);
	} else {
		throw new IllegalActionError('Error.MergeClauseItems.NoFollower');
	}
};

/**
 * Merge the given two clause items into the first one and remove the second one afterwards.
 * @param {ClauseItem} itemOne - leading clause item to merge
 * @param {ClauseItem} itemTwo - trailing clause item to merge
 * @returns {void}
 */
const mergeClauseItems = function(itemOne, itemTwo) {
	itemOne.originText = joinStrings(itemOne.originText, itemTwo.originText, ' ');
	if (!itemOne.syntacticFunction) {
		itemOne.syntacticFunction = itemTwo.syntacticFunction;
	}
	itemOne.parent.removeClauseItems([ itemTwo ]);
};

/**
 * Split the given clause item after the specified origin text part.
 * @param {ClauseItem} itemToSplit - clause item to split into two
 * @param {string} firstOriginTextPart - leading part of the origin text after which to split the clause item into two
 * @returns {void}
 */
export const splitClauseItem = function(itemToSplit, firstOriginTextPart) {
	if (!firstOriginTextPart || !itemToSplit.originText.startsWith(firstOriginTextPart) || itemToSplit.originText === firstOriginTextPart) {
		throw new Error('Illegal originText part provided');
	}
	const remainingOriginText = itemToSplit.originText.substring(firstOriginTextPart.length).trim();
	const itemToAppend = new ClauseItem(remainingOriginText);
	itemToSplit.originText = firstOriginTextPart.trim();
	itemToSplit.parent.addClauseItemAfterPrior(itemToAppend, itemToSplit);
};

/**
 * Create a relation over the given associates by setting their roles and weights according to the specified template.
 * @param {(Relation|Proposition)[]} associates - elements to combine under new super ordinated relation
 * @param {RelationTemplate} template - definition of applicable roles and weights of the associates in the new relation
 * @returns {Relation} created relation over the given associates
 */
export const createRelation = function(associates, template) {
	// no associate is allowed to have a super ordinated relation
	if (_.some(associates, associate => associate.superOrdinatedRelation)) {
		throw new IllegalActionError('Error.CreateRelation.NotConnected');
	}
	// ensure associates are in correct order and immediately adjacent to oneanother (ignoring partAfterArrows)
	if (_.every(associates.slice(0, -1), (reference, i) => isPriorOf(reference, associates[i + 1], true))) {
		return new Relation(associates, template);
	}
	throw new IllegalActionError('Error.CreateRelation.NotConnected');
};

/**
 * Rotate the roles (with their weights) between all associates of the given relation,
 * by one step from top to bottom.
 * @param {Relation} relation - relation in which to rotate all associates' roles
 * @returns {void}
 */
export const rotateAssociateRoles = function(relation) {
	let priorRole = relation.associates[0].role;
	_.forEach(relation.associates.slice(1), associate => {
		const oldRole = associate.role;
		associate.role = priorRole;
		priorRole = oldRole;
	});
	relation.associates[0].role = priorRole;
};

/**
 * Change the given relations type according to the specified template.
 * @param {Relation} relation - relation to change the type of
 * @param {RelationTempate} template - new relation type to apply
 * @returns {void}
 */
export const alterRelationType = function(relation, template) {
	const roles = template.getAssociateRoles(relation.associates.length);
	_.forEach(relation.associates, (associate, index) => {
		associate.role = roles[index];
	});
};

/**
 * Add the specified origin text as new propositions
 * in front of the existing ones on the given pericope.
 * @param {Pericope} pericope - pericope to prepend origin text to
 * @param {string} originText - origin text to prepend
 * @returns {void}
 */
export const prependText = function(pericope, originText) {
	pericope.prependPropositions(buildPropositionsFromText(originText));
};

/**
 * Add the specified origin text as new propositions
 * behind the existing ones on the given pericope.
 * @param {Pericope} pericope - pericope to append origin text to
 * @param {string} originText - origin text to append
 * @returns {void}
 */
export const appendText = function(pericope, originText) {
	pericope.appendPropositions(buildPropositionsFromText(originText));
};

/**
 * Remove the specified propositions and their super ordinated relations from the given pericope.
 * Propositions must not be subordinated to another one and have no child Propositions of their own.
 * @param {Pericope} pericope - pericope to remove given propositions from
 * @param {Proposition[]} propositionsToRemove - propositions to remove from pericope
 * @returns {void}
 */
export const removePropositions = function(pericope, propositionsToRemove) {
	if (propositionsToRemove.length === 0) {
		throw new IllegalActionError('Error.DeletePropositions.NoneSelected');
	}
	if (_.some(propositionsToRemove, proposition =>
		proposition.parent instanceof Proposition || proposition.partAfterArrow || proposition.priorChildren.length > 0 || proposition.laterChildren.length > 0)) {
		throw new IllegalActionError('Error.DeletePropositions.ConditionsNotMet');
	}
	if (propositionsToRemove.length === pericope.flatText.length) {
		throw new IllegalActionError('Error.DeletePropositions.AllSelected');
	}
	_.forEach(propositionsToRemove, proposition => {
		if (proposition.superOrdinatedRelation) {
			proposition.superOrdinatedRelation.kill();
		}
		pericope.removeChild(proposition);
	});
};

/**
 * Utility method for a null/empty-aware joining of two strings with the given separator in between.
 * @param {?string} textOne - first string to combine with the second one
 * @param {?string} textTwo - second string to combine with the first one
 * @param {string} separator - separator to insert between the other two string (only if they are both neither null nor empty)
 * @returns {?string} joined string (or the non-null/non-empty one of the two)
 */
const joinStrings = function(textOne, textTwo, separator) {
	if (!textOne || textOne.length === 0) {
		return textTwo;
	}
	if (!textTwo || textTwo.length === 0) {
		return textOne;
	}
	return textOne.concat(separator, textTwo);
};
