import * as ActionCreator from '../../src/actions/index';
import PericopeReducer from '../../src/pericope/reducer';
import LanguageModel from '../../src/pericope/model/languageModel';
import SyntacticFunction from '../../src/pericope/model/syntacticFunction';
import RelationTemplate from '../../src/pericope/model/relationTemplate';
import AssociateRole from '../../src/pericope/model/associateRole';

describe('PericopeReducer', () => {
	let currentState, first, second, third, fourth, syntacticFunction;

	beforeEach(function() {
		first = {
			index: 0,
			clauseItems: [
				{ index: 0, parentIndex: 0, originText: '1.1' },
				{ index: 1, parentIndex: 0, originText: '1.2' }
			]
		};
		second = {
			index: 1,
			clauseItems: [ { index: 0, parentIndex: 1, originText: '2.1 2.2' } ]
		};
		third = {
			index: 2,
			clauseItems: [ { index: 0, parentIndex: 2, originText: '3' } ]
		};
		fourth = {
			index: 3,
			clauseItems: [ { index: 0, parentIndex: 3, originText: '4' } ]
		};
		first.partAfterArrow = fourth;
		second.laterChildren = [ third ];
		fourth.priorChildren = [ second ];
		syntacticFunction = new SyntacticFunction('SF', 'Syn. Func.');
		currentState = {
			language: new LanguageModel('Language', true, [ [ syntacticFunction ] ]),
			text: [ first ],
			connectables: [
				{
					index: 0,
					associates: [
						{
							index: 0,
							role: new AssociateRole('High', true)
						},
						{
							index: 1,
							role: new AssociateRole('Low', false)
						}
					]
				},
				{ index: 2 }
			]
		};
	});

	it('on unknown action and undefined current state: get initial state', () => {
		const action = { type: '???UNKNOWN???' };
		const initialState = {
			language: new LanguageModel('', true, [ [ ] ]),
			text: [ ],
			connectables: [ ]
		};

		expect(PericopeReducer(undefined, action)).toEqual(initialState);
	});

	it('on unknown action and existing current state: get current state', () => {
		const action = { type: '???UNKNOWN???' };

		expect(PericopeReducer(currentState, action)).toBe(currentState);
	});

	it('on NEW_PROJECT action: reset to initial state', () => {
		const action = ActionCreator.createNewProject();
		const initialState = {
			language: new LanguageModel('', true, [ [ ] ]),
			text: [ ],
			connectables: [ ]
		};

		expect(PericopeReducer(null, action)).toEqual(initialState);
	});

	it('on START_ANALYSIS action: create Pericope from origin text', () => {
		const action = ActionCreator.startAnalysis(' 1\n 2 \n\n3.1    3.2\t3.3   \t  \n  \n4\n  ');
		const newState = PericopeReducer(currentState, action);

		expect(newState.text.length).toBe(4);
		expect(newState.text[0].clauseItems.length).toBe(1);
		expect(newState.text[0].clauseItems[0].originText).toEqual('1');
		expect(newState.text[1].clauseItems.length).toBe(1);
		expect(newState.text[1].clauseItems[0].originText).toEqual('2');
		expect(newState.text[2].clauseItems.length).toBe(3);
		expect(newState.text[2].clauseItems[0].originText).toEqual('3.1');
		expect(newState.text[2].clauseItems[1].originText).toEqual('3.2');
		expect(newState.text[2].clauseItems[2].originText).toEqual('3.3');
		expect(newState.text[3].clauseItems.length).toBe(1);
		expect(newState.text[3].clauseItems[0].originText).toEqual('4');
	});

	it('on INDENT_PROPOSITION action: indent one Proposition under another', () => {
		const action = ActionCreator.indentPropositionUnderParent(third, fourth, syntacticFunction);
		const newState = PericopeReducer(currentState, action);

		expect(newState).not.toBe(currentState);
		expect(newState.text.length).toBe(1);
		expect(newState.text[0].clauseItems.length).toBe(2);
		expect(newState.text[0].clauseItems[0].originText).toEqual('1.1');
		expect(newState.text[0].clauseItems[1].originText).toEqual('1.2');
		const propFour = newState.text[0].partAfterArrow;
		expect(propFour.priorChildren.length).toBe(2);
		expect(propFour.priorChildren[0].clauseItems.length).toBe(1);
		expect(propFour.priorChildren[0].clauseItems[0].originText).toEqual('2.1 2.2');
		expect(propFour.priorChildren[1].clauseItems.length).toBe(1);
		expect(propFour.priorChildren[1].clauseItems[0].originText).toEqual('3');
		expect(propFour.priorChildren[1].syntacticFunction).toEqual(syntacticFunction);
		expect(propFour.clauseItems.length).toBe(1);
		expect(propFour.clauseItems[0].originText).toEqual('4');
	});

	it('on MERGE_PROPOSITIONS action: merge one Proposition with another', () => {
		const action = ActionCreator.mergePropositions(second, third);
		const newState = PericopeReducer(currentState, action);

		expect(newState).not.toBe(currentState);
		expect(newState.text.length).toBe(1);
		expect(newState.text[0].clauseItems.length).toBe(2);
		expect(newState.text[0].clauseItems[0].originText).toEqual('1.1');
		expect(newState.text[0].clauseItems[1].originText).toEqual('1.2');
		const propThree = newState.text[0].partAfterArrow;
		expect(propThree.priorChildren.length).toBe(1);
		expect(propThree.priorChildren[0].clauseItems.length).toBe(2);
		expect(propThree.priorChildren[0].clauseItems[0].originText).toEqual('2.1 2.2');
		expect(propThree.priorChildren[0].clauseItems[1].originText).toEqual('3');
		expect(propThree.clauseItems.length).toBe(1);
		expect(propThree.clauseItems[0].originText).toEqual('4');
	});

	it('on REMOVE_INDENTATION action: move a Proposition up by one step', () => {
		const action = ActionCreator.removeOneIndentation(third);
		const newState = PericopeReducer(currentState, action);

		expect(newState).not.toBe(currentState);
		expect(newState.text.length).toBe(1);
		expect(newState.text[0].clauseItems.length).toBe(2);
		expect(newState.text[0].clauseItems[0].originText).toEqual('1.1');
		expect(newState.text[0].clauseItems[1].originText).toEqual('1.2');
		const propFour = newState.text[0].partAfterArrow;
		expect(propFour.priorChildren.length).toBe(2);
		expect(propFour.priorChildren[0].clauseItems.length).toBe(1);
		expect(propFour.priorChildren[0].clauseItems[0].originText).toEqual('2.1 2.2');
		expect(propFour.priorChildren[1].clauseItems.length).toBe(1);
		expect(propFour.priorChildren[1].clauseItems[0].originText).toEqual('3');
		expect(propFour.clauseItems.length).toBe(1);
		expect(propFour.clauseItems[0].originText).toEqual('4');
	});

	it('on SPLIT_PROPOSITION action: cut one Proposition in two', () => {
		const action = ActionCreator.splitProposition(first.clauseItems[0]);
		const newState = PericopeReducer(currentState, action);

		expect(newState).not.toBe(currentState);
		expect(newState.text.length).toBe(2);
		expect(newState.text[0].clauseItems.length).toBe(1);
		expect(newState.text[0].clauseItems[0].originText).toEqual('1.1');
		expect(newState.text[0].partAfterArrow).toBe(undefined);
		expect(newState.text[1].clauseItems.length).toBe(1);
		expect(newState.text[1].clauseItems[0].originText).toEqual('1.2');
		const propFive = newState.text[1].partAfterArrow;
		expect(propFive.priorChildren.length).toBe(1);
		const propThree = propFive.priorChildren[0];
		expect(propThree.clauseItems.length).toBe(1);
		expect(propThree.clauseItems[0].originText).toEqual('2.1 2.2');
		expect(propThree.laterChildren.length).toBe(1);
		expect(propThree.laterChildren[0].clauseItems.length).toBe(1);
		expect(propThree.laterChildren[0].clauseItems[0].originText).toEqual('3');
		expect(propFive.clauseItems.length).toBe(1);
		expect(propFive.clauseItems[0].originText).toEqual('4');
	});

	it('on RESET_STANDALONE_STATE action: make a Proposition partAfterArrow standalone', () => {
		const action = ActionCreator.resetStandaloneStateOfPartAfterArrow(fourth);
		const newState = PericopeReducer(currentState, action);

		expect(newState).not.toBe(currentState);
		expect(newState.text.length).toBe(2);
		expect(newState.text[0].clauseItems.length).toBe(2);
		expect(newState.text[0].clauseItems[0].originText).toEqual('1.1');
		expect(newState.text[0].clauseItems[1].originText).toEqual('1.2');
		expect(newState.text[1].priorChildren.length).toBe(1);
		const propTwo = newState.text[1].priorChildren[0];
		expect(propTwo.clauseItems.length).toBe(1);
		expect(propTwo.clauseItems[0].originText).toEqual('2.1 2.2');
		expect(propTwo.laterChildren.length).toBe(1);
		expect(propTwo.laterChildren[0].clauseItems.length).toBe(1);
		expect(propTwo.laterChildren[0].clauseItems[0].originText).toEqual('3');
		expect(newState.text[1].clauseItems.length).toBe(1);
		expect(newState.text[1].clauseItems[0].originText).toEqual('4');
	});

	it('on MERGE_CLAUSE_ITEM_WITH_PRIOR action: merge two clause items', () => {
		const action = ActionCreator.mergeClauseItemWithPrior(first.clauseItems[1]);
		const newState = PericopeReducer(currentState, action);

		expect(newState).not.toBe(currentState);
		expect(newState.text.length).toBe(1);
		expect(newState.text[0].clauseItems.length).toBe(1);
		expect(newState.text[0].clauseItems[0].originText).toEqual('1.1 1.2');
		const propFour = newState.text[0].partAfterArrow;
		expect(propFour.priorChildren.length).toBe(1);
		const propTwo = propFour.priorChildren[0];
		expect(propTwo.clauseItems.length).toBe(1);
		expect(propTwo.clauseItems[0].originText).toEqual('2.1 2.2');
		expect(propTwo.laterChildren.length).toBe(1);
		expect(propTwo.laterChildren[0].clauseItems.length).toBe(1);
		expect(propTwo.laterChildren[0].clauseItems[0].originText).toEqual('3');
		expect(propFour.clauseItems.length).toBe(1);
		expect(propFour.clauseItems[0].originText).toEqual('4');
	});

	it('on MERGE_CLAUSE_ITEM_WITH_FOLLOWER action: merge two clause items', () => {
		const action = ActionCreator.mergeClauseItemWithFollower(first.clauseItems[0]);
		const newState = PericopeReducer(currentState, action);

		expect(newState).not.toBe(currentState);
		expect(newState.text.length).toBe(1);
		expect(newState.text[0].clauseItems.length).toBe(1);
		expect(newState.text[0].clauseItems[0].originText).toEqual('1.1 1.2');
		const propFour = newState.text[0].partAfterArrow;
		expect(propFour.priorChildren.length).toBe(1);
		const propTwo = propFour.priorChildren[0];
		expect(propTwo.clauseItems.length).toBe(1);
		expect(propTwo.clauseItems[0].originText).toEqual('2.1 2.2');
		expect(propTwo.laterChildren.length).toBe(1);
		expect(propTwo.laterChildren[0].clauseItems.length).toBe(1);
		expect(propTwo.laterChildren[0].clauseItems[0].originText).toEqual('3');
		expect(propFour.clauseItems.length).toBe(1);
		expect(propFour.clauseItems[0].originText).toEqual('4');
	});

	it('on SPLIT_CLAUSE_ITEM action: split a Clause Item into two', () => {
		const action = ActionCreator.splitClauseItem(second.clauseItems[0], '2.1');
		const newState = PericopeReducer(currentState, action);

		expect(newState).not.toBe(currentState);
		expect(newState.text.length).toBe(1);
		expect(newState.text[0].clauseItems.length).toBe(2);
		expect(newState.text[0].clauseItems[0].originText).toEqual('1.1');
		expect(newState.text[0].clauseItems[1].originText).toEqual('1.2');
		const propFour = newState.text[0].partAfterArrow;
		expect(propFour.priorChildren.length).toBe(1);
		const propTwo = propFour.priorChildren[0];
		expect(propTwo.clauseItems.length).toBe(2);
		expect(propTwo.clauseItems[0].originText).toEqual('2.1');
		expect(propTwo.clauseItems[1].originText).toEqual('2.2');
		expect(propTwo.laterChildren.length).toBe(1);
		expect(propTwo.laterChildren[0].clauseItems.length).toBe(1);
		expect(propTwo.laterChildren[0].clauseItems[0].originText).toEqual('3');
		expect(propFour.clauseItems.length).toBe(1);
		expect(propFour.clauseItems[0].originText).toEqual('4');
	});

	it('on CREATE_RELATION action: create a Relation', () => {
		const role = new AssociateRole('A', true);
		const relation12 = currentState.connectables[0];
		const action = ActionCreator.createRelation([ relation12, third ], new RelationTemplate(role, role, role));
		const newState = PericopeReducer(currentState, action);

		expect(newState).not.toBe(currentState);
		expect(newState.connectables.length).toBe(1);
		const newRelation = newState.connectables[0];
		expect(newRelation.associates.length).toBe(2);
		expect(newRelation.associates[0].role).toEqual(role);
		expect(newRelation.associates[0].associates).toEqual(relation12.associates);
		expect(newRelation.associates[1].role).toEqual(role);
		expect(newRelation.associates[1].associates).toBe(undefined);
	});

	it('on ROTATE_ASSOCIATE_ROLES action: rotate roles/weights of an existing Relation', () => {
		const oldRelation = currentState.connectables[0];
		const action = ActionCreator.rotateAssociateRoles(oldRelation);
		const newState = PericopeReducer(currentState, action);

		expect(newState).not.toBe(currentState);
		expect(newState.connectables.length).toBe(2);
		const updatedRelation = newState.connectables[0];
		expect(updatedRelation.associates.length).toBe(2);
		expect(updatedRelation.associates[0].role).not.toEqual(oldRelation.associates[0].role);
		expect(updatedRelation.associates[0].role).toEqual(oldRelation.associates[1].role);
		expect(updatedRelation.associates[1].role).not.toEqual(oldRelation.associates[1].role);
		expect(updatedRelation.associates[1].role).toEqual(oldRelation.associates[0].role);
	});

	it('on ALTER_RELATION_TYPE action: apply new roles/weights to an existing Relation', () => {
		const oldRelation = currentState.connectables[0];
		const newRoleOne = new AssociateRole('A', false);
		const newRoleTwo = new AssociateRole('B', true);
		const action = ActionCreator.alterRelationType(oldRelation, new RelationTemplate(newRoleOne, null, newRoleTwo));
		const newState = PericopeReducer(currentState, action);

		expect(newState).not.toBe(currentState);
		expect(newState.connectables.length).toBe(2);
		const updatedRelation = newState.connectables[0];
		expect(updatedRelation.associates.length).toBe(2);
		expect(updatedRelation.associates[0].role).not.toEqual(oldRelation.associates[0].role);
		expect(updatedRelation.associates[0].role).toEqual(newRoleOne);
		expect(updatedRelation.associates[1].role).not.toEqual(oldRelation.associates[1].role);
		expect(updatedRelation.associates[1].role).toEqual(newRoleTwo);
	});

	it('on REMOVE_RELATION action: remove an existing Relation', () => {
		const action = ActionCreator.removeRelation(currentState.connectables[0]);
		const newState = PericopeReducer(currentState, action);

		expect(newState).not.toBe(currentState);
		expect(newState.connectables.length).toBe(3);
		expect(newState.connectables[0].associates).toBe(undefined);
		expect(newState.connectables[1].associates).toBe(undefined);
		expect(newState.connectables[2].associates).toBe(undefined);
	});

	it('on PREPEND_TEXT action: add Proposition in front', () => {
		const action = ActionCreator.prependText('0');
		const newState = PericopeReducer(currentState, action);

		expect(newState).not.toBe(currentState);
		expect(newState.text.length).toBe(2);
		expect(newState.text[0].clauseItems.length).toBe(1);
		expect(newState.text[0].clauseItems[0].originText).toEqual('0');
		expect(newState.text[1].clauseItems.length).toBe(2);
		expect(newState.text[1].clauseItems[0].originText).toEqual('1.1');
		expect(newState.text[1].clauseItems[1].originText).toEqual('1.2');
		const propFour = newState.text[1].partAfterArrow;
		expect(propFour.priorChildren.length).toBe(1);
		const propTwo = propFour.priorChildren[0];
		expect(propTwo.clauseItems.length).toBe(1);
		expect(propTwo.clauseItems[0].originText).toEqual('2.1 2.2');
		expect(propTwo.laterChildren.length).toBe(1);
		expect(propTwo.laterChildren[0].clauseItems.length).toBe(1);
		expect(propTwo.laterChildren[0].clauseItems[0].originText).toEqual('3');
		expect(propFour.clauseItems.length).toBe(1);
		expect(propFour.clauseItems[0].originText).toEqual('4');
	});

	it('on APPEND_TEXT action: add Proposition at the end', () => {
		const action = ActionCreator.appendText('5');
		const newState = PericopeReducer(currentState, action);

		expect(newState).not.toBe(currentState);
		expect(newState.text.length).toBe(2);
		expect(newState.text[0].clauseItems.length).toBe(2);
		expect(newState.text[0].clauseItems[0].originText).toEqual('1.1');
		expect(newState.text[0].clauseItems[1].originText).toEqual('1.2');
		const propFour = newState.text[0].partAfterArrow;
		expect(propFour.priorChildren.length).toBe(1);
		const propTwo = propFour.priorChildren[0];
		expect(propTwo.clauseItems.length).toBe(1);
		expect(propTwo.clauseItems[0].originText).toEqual('2.1 2.2');
		expect(propTwo.laterChildren.length).toBe(1);
		expect(propTwo.laterChildren[0].clauseItems.length).toBe(1);
		expect(propTwo.laterChildren[0].clauseItems[0].originText).toEqual('3');
		expect(propFour.clauseItems.length).toBe(1);
		expect(propFour.clauseItems[0].originText).toEqual('4');
		expect(newState.text[1].clauseItems.length).toBe(1);
		expect(newState.text[1].clauseItems[0].originText).toEqual('5');
	});

	it('on REMOVE_PROPOSITIONS action: remove Proposition', () => {
		const fifth = {
			index: 4,
			clauseItems: [ { index: 0, parentIndex: 4, originText: '5' } ]
		};
		const sixth = {
			index: 5,
			clauseItems: [ { index: 0, parentIndex: 5, originText: '6' } ]
		};
		currentState.text = [ ...currentState.text, fifth, sixth ];
		const action = ActionCreator.removePropositions([ fifth ]);
		const newState = PericopeReducer(currentState, action);

		expect(newState).not.toBe(currentState);
		expect(newState.text.length).toBe(2);
		expect(newState.text[0].clauseItems.length).toBe(2);
		expect(newState.text[0].clauseItems[0].originText).toEqual('1.1');
		expect(newState.text[0].clauseItems[1].originText).toEqual('1.2');
		const propFour = newState.text[0].partAfterArrow;
		expect(propFour.priorChildren.length).toBe(1);
		const propTwo = propFour.priorChildren[0];
		expect(propTwo.clauseItems.length).toBe(1);
		expect(propTwo.clauseItems[0].originText).toEqual('2.1 2.2');
		expect(propTwo.laterChildren.length).toBe(1);
		expect(propTwo.laterChildren[0].clauseItems.length).toBe(1);
		expect(propTwo.laterChildren[0].clauseItems[0].originText).toEqual('3');
		expect(propFour.clauseItems.length).toBe(1);
		expect(propFour.clauseItems[0].originText).toEqual('4');
		expect(newState.text[1].index).toBe(4);
		expect(newState.text[1].clauseItems.length).toBe(1);
		expect(newState.text[1].clauseItems[0].originText).toEqual('6');
	});
});
