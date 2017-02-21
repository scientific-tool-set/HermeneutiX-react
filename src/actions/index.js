export const NEW_PROJECT = 'NEW_PROJECT';
export const START_ANALYSIS = 'START_ANALYSIS';
export const INDENT_PROPOSITION = 'INDENT_PROPOSITION';
export const MERGE_PROPOSITIONS = 'MERGE_PROPOSITIONS';
export const REMOVE_INDENTATION = 'REMOVE_INDENTATION';
export const SPLIT_PROPOSITION = 'SPLIT_PROPOSITION';
export const RESET_STANDALONE_STATE = 'RESET_STANDALONE_STATE';
export const MERGE_CLAUSE_ITEM_WITH_PRIOR = 'MERGE_CLAUSE_ITEM_WITH_PRIOR';
export const MERGE_CLAUSE_ITEM_WITH_FOLLOWER = 'MERGE_CLAUSE_ITEM_WITH_FOLLOWER';
export const SPLIT_CLAUSE_ITEM = 'SPLIT_CLAUSE_ITEM';
export const CREATE_RELATION = 'CREATE_RELATION';
export const ROTATE_ASSOCIATE_ROLES = 'ROTATE_ASSOCIATE_ROLES';
export const ALTER_RELATION_TYPE = 'ALTER_RELATION_TYPE';
export const PREPEND_TEXT = 'PREPEND_TEXT';
export const APPEND_TEXT = 'APPEND_TEXT';
export const REMOVE_PROPOSITIONS = 'REMOVE_PROPOSITIONS';

/**
 * Helper for constructing consistent action objects.
 * @param {string} type - constant determing the action's type
 * @param {undefined} payload - repective content to include as contextual information in the action
 * @returns {{ type: string, payload: undefined}} created action
 */
const createAction = (type, payload = [ ]) => ({ type, ...payload });

/**
 * Action Creator: initialising a new (empty) project.
 * @returns {{ type: string }} created action
 */
export const createNewProject = () => ({ type: NEW_PROJECT });

/**
 * Action Creator:
 * @param {string} originText - origin text to create initial pericope structure from
 * @returns {{ type: string, originText: string }} created action
 */
export const startAnalysis = originText => createAction(START_ANALYSIS, { originText });

/**
 * Action Creator: Subordinate the given target proposition under the specified parent and set its indentation function.
 * This may influence indentations of propositions between the given two (target and parent).
 * @param {Proposition} target - proposition to subordinate under parent
 * @param {Proposition} parent - proposition to subordinate target to
 * @param {SyntacticFunction} syntacticFunction - indentation function to set for target
 * @returns {{ action: string, target: Proposition, parent: Proposition, syntacticFunction: SyntacticFunction }} created action
 */
export const indentPropositionUnderParent = (target, parent, syntacticFunction) => createAction(INDENT_PROPOSITION, { target, parent, syntacticFunction });

/**
 * Action Creator: Merge the two given propositions, which need to be the same kind of children to the same parent or at least adjacent to oneanother.
 * @param {Proposition} propOne - one proposition to merge with the other
 * @param {Proposition} propTwo - other proposition to merge with the one
 * @returns {{ action: string, propOne: Proposition, propTwo: Proposition }} created action
 */
export const mergePropositions = (propOne, propTwo) => createAction(MERGE_PROPOSITIONS, { propOne, propTwo });

/**
 * Action Creator: Make the given proposition a sibling of its current parent, i.e. un-subordinate it once.
 * @param {Proposition} proposition - proposition to move up to the same level as its parent
 * @returns {{ action: string, proposition: Proposition }} created action
 */
export const removeOneIndentation = proposition => createAction(REMOVE_INDENTATION, { proposition });

/**
 * Action Creator: Split the selected proposition after the designated clause item and
 * remove all relations that will become invalid by this change.
 * @param {Proposition} proposition - proposition two split into two independent ones
 * @param {ClauseItem} lastItemInFirstPart - last clause item after which to split the proposition
 * @returns {{ action: string, proposition: Proposition, lastItemInFirstPart: ClauseItem }} created action
 */
export const splitProposition = (proposition, lastItemInFirstPart) => createAction(SPLIT_PROPOSITION, { proposition, lastItemInFirstPart });

/**
 * Action Creator: Restore the standalone state of the given proposition part.
 * @param {Proposition} partAfterArrow - proposition part to revert into connectable proposition
 * @returns {{ action: string, partAfterArrow: Proposition }} created action
 */
export const resetStandaloneStateOfPartAfterArrow = partAfterArrow => createAction(RESET_STANDALONE_STATE, { partAfterArrow });

/**
 * Action Creator: Merge the given clause item with its preceeding clause item.
 * @param {ClauseItem} itemToMerge - trailing clause item to merge
 * @returns {{ action: string, itemToMerge: ClauseItem }} created action
 */
export const mergeClauseItemWithPrior = itemToMerge => createAction(MERGE_CLAUSE_ITEM_WITH_PRIOR, { itemToMerge });

/**
 * Action Creator: Merge the given clause item with its following clause item.
 * @param {ClauseItem} itemToMerge - leading clause item to merge
 * @returns {{ action: string, itemToMerge: ClauseItem }} created action
 */
export const mergeClauseItemWithFollower = itemToMerge => createAction(MERGE_CLAUSE_ITEM_WITH_FOLLOWER, { itemToMerge });

/**
 * Split the given clause item after the specified origin text part.
 * @param {ClauseItem} itemToSplit - clause item to split into two
 * @param {string} firstOriginTextPart - leading part of the origin text after which to split the clause item into two
 * @returns {{ action: string, itemToSplit: ClauseItem, firstOriginTextPart: string }} created action
 */
export const splitClauseItem = (itemToSplit, firstOriginTextPart) => createAction(SPLIT_CLAUSE_ITEM, { itemToSplit, firstOriginTextPart });

/**
 * Action Creator: Create a relation over the given associates by setting their roles and weights according to the specified template.
 * @param {(Relation|Proposition)[]} associates - elements to combine under new super ordinated relation
 * @param {RelationTemplate} template - definition of applicable roles and weights of the associates in the new relation
 * @returns {{ action: string, associates: (Relation|Proposition)[], template: RelationTempate }} created action
 */
export const createRelation = (associates, template) => createAction(CREATE_RELATION, { associates, template });

/**
 * Action Creator: Rotate the roles (with their weights) between all associates of the given relation, by one step from top to bottom.
 * @param {Relation} relation - relation in which to rotate all associates' roles
 * @returns {{ action: string, relation: Relation }} created action
 */
export const rotateAssociateRoles = relation => createAction(ROTATE_ASSOCIATE_ROLES, { relation });

/**
 * Action Creator: Change the given relations type according to the specified template.
 * @param {Relation} relation - relation to change the type of
 * @param {RelationTempate} template - new relation type to apply
 * @returns {{ action: string, relation: Relation, template: RelationTempate }} created action
 */
export const alterRelationType = (relation, template) => createAction(ALTER_RELATION_TYPE, { relation, template });

/**
 * Action Creator: Add the specified origin text as new propositions in front of the existing ones.
 * @param {string} originText - origin text to prepend
 * @returns {{ action: string, originText: string }} created action
 */
export const prependText = originText => createAction(PREPEND_TEXT, { originText });

/**
 * Action Creator: Add the specified origin text as new propositions behind the existing ones.
 * @param {string} originText - origin text to append
 * @returns {{ action: string, originText: string }} created action
 */
export const appendText = originText => createAction(APPEND_TEXT, { originText });

/**
 * Action Creator: Remove the specified propositions and their super ordinated relations.
 * Propositions must not be subordinated to other ones and have no child Propositions of their own.
 * @param {Proposition[]} propositions - propositions to remove from pericope
 * @returns {{ action: string, propositions: Proposition[] }} created action
 */
export const removePropositions = propositions => createAction(REMOVE_PROPOSITIONS, propositions);
