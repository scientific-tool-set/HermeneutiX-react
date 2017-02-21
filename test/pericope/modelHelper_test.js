import { List } from 'immutable';

import * as ModelHelper from '../../src/pericope/modelHelper';
import LanguageModel from '../../src/pericope/model/languageModel';
import SyntacticFunction from '../../src/pericope/model/syntacticFunction';
import SyntacticFunctionGroup from '../../src/pericope/model/syntacticFunctionGroup';
import Pericope from '../../src/pericope/model/pericope';
import Proposition from '../../src/pericope/model/proposition';
import ClauseItem from '../../src/pericope/model/clauseItem';
import Relation from '../../src/pericope/model/relation';
import AssociateRole from '../../src/pericope/model/associateRole';

describe('ModelHelper', () => {
	const language = new LanguageModel('SomeLanguage', true, [
		[
			new SyntacticFunction('A', 'A Function'),
			new SyntacticFunction('B', 'Second Function', true, 'some description'),
			new SyntacticFunctionGroup('Group', null, [
				new SyntacticFunction('C', 'Nested Function'),
				new SyntacticFunction('D', 'Other Sub Function', false, 'The last one')
			])
		]
	]);

	describe('buildPropositionsFromText()', () => {
		it('ignore empty lines', () => {
			const propositions = ModelHelper.buildPropositionsFromText(' \t\n \t  \nText\n\t \n');

			expect(propositions.size).toBe(1);
			expect(propositions.first().clauseItems.size).toBe(1);
			expect(propositions.first().clauseItems.first().originText).toEqual('Text');
		});

		it('ignore leading and trailing whitespaces per Proposition', () => {
			const propositions = ModelHelper.buildPropositionsFromText(' \t \t  01234\t \n  56789\t ');

			expect(propositions.size).toBe(2);
			expect(propositions.first().clauseItems.size).toBe(1);
			expect(propositions.first().clauseItems.first().originText).toEqual('01234');
			expect(propositions.last().clauseItems.size).toBe(1);
			expect(propositions.last().clauseItems.first().originText).toEqual('56789');
		});

		it('ignore leading and trailing whitespaces per Clause Item', () => {
			const propositions = ModelHelper.buildPropositionsFromText('1 \t 2\t\t3     \n  4\t5\t6 ');

			expect(propositions.size).toBe(2);
			expect(propositions.first().clauseItems.size).toBe(3);
			expect(propositions.first().clauseItems.first().originText).toEqual('1');
			expect(propositions.first().clauseItems.get(1).originText).toEqual('2');
			expect(propositions.first().clauseItems.last().originText).toEqual('3');
			expect(propositions.last().clauseItems.size).toBe(3);
			expect(propositions.last().clauseItems.first().originText).toEqual('4');
			expect(propositions.last().clauseItems.get(1).originText).toEqual('5');
			expect(propositions.last().clauseItems.last().originText).toEqual('6');
		});

		it('reduce multiple whitespaces to a single one inside a Clause Item', () => {
			const propositions = ModelHelper.buildPropositionsFromText('1 2  3   4');

			expect(propositions.size).toBe(1);
			expect(propositions.first().clauseItems.size).toBe(1);
			expect(propositions.first().clauseItems.first().originText).toEqual('1 2 3 4');
		});

		it('split Clause Items by tabs and 4+ whitespaces', () => {
			const propositions = ModelHelper.buildPropositionsFromText('4    5     6      Tab\tTabs\t\tCombined  \t  End.');

			expect(propositions.size).toBe(1);
			expect(propositions.first().clauseItems.size).toBe(7);
			expect(propositions.first().clauseItems.first().originText).toEqual('4');
			expect(propositions.first().clauseItems.get(1).originText).toEqual('5');
			expect(propositions.first().clauseItems.get(2).originText).toEqual('6');
			expect(propositions.first().clauseItems.get(3).originText).toEqual('Tab');
			expect(propositions.first().clauseItems.get(4).originText).toEqual('Tabs');
			expect(propositions.first().clauseItems.get(5).originText).toEqual('Combined');
			expect(propositions.first().clauseItems.last(6).originText).toEqual('End.');
		});
	});

	describe('getFlatText()', () => {
		let first, second, third, fourth, fifth, sixth, seventh;

		beforeEach(function() {
			first = new Proposition([ new ClauseItem('1') ]);
			second = new Proposition([ new ClauseItem('2') ]);
			third = new Proposition([ new ClauseItem('3') ]);
			fourth = new Proposition([ new ClauseItem('4') ]);
			fifth = new Proposition([ new ClauseItem('5') ]);
			sixth = new Proposition([ new ClauseItem('6') ]);
			seventh = new Proposition([ new ClauseItem('7') ]);
		});

		[ false, true ].forEach(skipPartAfterArrows => {
			it(`handle top level Propositions only (with skipPartAfterArrows = ${skipPartAfterArrows})`, () => {
				const pericope = new Pericope([ first, second, third, fourth, fifth, sixth, seventh ], language);
				const flatText = ModelHelper.getFlatText(pericope, skipPartAfterArrows).cacheResult();

				expect(flatText.count()).toBe(7);
				expect(flatText.first()).toBe(first);
				expect(flatText.get(1)).toBe(second);
				expect(flatText.get(2)).toBe(third);
				expect(flatText.get(3)).toBe(fourth);
				expect(flatText.get(4)).toBe(fifth);
				expect(flatText.get(5)).toBe(sixth);
				expect(flatText.last()).toBe(seventh);
			});
		});

		[ false, true ].forEach(skipPartAfterArrows => {
			it(`handle child Propositions (with skipPartAfterArrows = ${skipPartAfterArrows})`, () => {
				second.laterChildren = [ third ];
				fourth.priorChildren = [ first, second ];
				fourth.laterChildren = [ fifth, seventh ];
				seventh.priorChildren = [ sixth ];
				const pericope = new Pericope([ fourth ], language);
				const flatText = ModelHelper.getFlatText(pericope, false).cacheResult();

				expect(flatText.count()).toBe(7);
				expect(flatText.first()).toBe(first);
				expect(flatText.get(1)).toBe(second);
				expect(flatText.get(2)).toBe(third);
				expect(flatText.get(3)).toBe(fourth);
				expect(flatText.get(4)).toBe(fifth);
				expect(flatText.get(5)).toBe(sixth);
				expect(flatText.last()).toBe(seventh);
			});
		});

		it('handle nested child Propositions (with skipPartAfterArrows = false)', () => {
			second.partAfterArrow = fifth;
			fifth.priorChildren = [ third, fourth ];
			fifth.laterChildren = [ sixth ];
			const pericope = new Pericope([ first, second, seventh ], language);
			const flatText = ModelHelper.getFlatText(pericope, false).cacheResult();

			expect(flatText.count()).toBe(7);
			expect(flatText.first()).toBe(first);
			expect(flatText.get(1)).toBe(second);
			expect(flatText.get(2)).toBe(third);
			expect(flatText.get(3)).toBe(fourth);
			expect(flatText.get(4)).toBe(fifth);
			expect(flatText.get(5)).toBe(sixth);
			expect(flatText.last()).toBe(seventh);
		});

		it('handle nested child Propositions (with skipPartAfterArrows = true)', () => {
			second.partAfterArrow = fifth;
			fifth.priorChildren = [ third, fourth ];
			fifth.laterChildren = [ sixth ];
			const pericope = new Pericope([ first, second, seventh ], language);
			const flatText = ModelHelper.getFlatText(pericope, true).cacheResult();

			expect(flatText.count()).toBe(6);
			expect(flatText.first()).toBe(first);
			expect(flatText.get(1)).toBe(second);
			expect(flatText.get(2)).toBe(third);
			expect(flatText.get(3)).toBe(fourth);
			// skipped fifth Propostion as it is a partAfterArrow
			expect(flatText.get(4)).toBe(sixth);
			expect(flatText.last()).toBe(seventh);
		});

		it('handle multiple partAfterArrows (with skipPartAfterArrows = false)', () => {
			first.partAfterArrow = third;
			third.priorChildren = [ second ];
			third.partAfterArrow = fifth;
			fifth.priorChildren = [ fourth ];
			fifth.partAfterArrow = seventh;
			seventh.priorChildren = [ sixth ];
			const pericope = new Pericope([ first ], language);
			const flatText = ModelHelper.getFlatText(pericope, false).cacheResult();

			expect(flatText.count()).toBe(7);
			expect(flatText.first()).toBe(first);
			expect(flatText.get(1)).toBe(second);
			expect(flatText.get(2)).toBe(third);
			expect(flatText.get(3)).toBe(fourth);
			expect(flatText.get(4)).toBe(fifth);
			expect(flatText.get(5)).toBe(sixth);
			expect(flatText.last()).toBe(seventh);
		});

		it('handle multiple partAfterArrows (with skipPartAfterArrows = true)', () => {
			first.partAfterArrow = third;
			third.priorChildren = [ second ];
			third.partAfterArrow = fifth;
			fifth.priorChildren = [ fourth ];
			fifth.partAfterArrow = seventh;
			seventh.priorChildren = [ sixth ];
			const pericope = new Pericope([ first ], language);
			const flatText = ModelHelper.getFlatText(pericope, true).cacheResult();

			expect(flatText.count()).toBe(4);
			expect(flatText.first()).toBe(first);
			expect(flatText.get(1)).toBe(second);
			// skipped third Propostion as it is a partAfterArrow
			expect(flatText.get(2)).toBe(fourth);
			// skipped fifth Propostion as it is a partAfterArrow
			expect(flatText.last()).toBe(sixth);
			// skipped seventh Proposition as it is a partAfterArrow
		});
	});

	describe('getContainingListInParent()', () => {
		let pericope, first, second, third, fourth, fifth, sixth, seventh;

		beforeEach(function() {
			first = new Proposition([ new ClauseItem('1') ]);
			second = new Proposition([ new ClauseItem('2') ]);
			third = new Proposition([ new ClauseItem('3') ]);
			fourth = new Proposition([ new ClauseItem('4') ]);
			fifth = new Proposition([ new ClauseItem('5') ]);
			sixth = new Proposition([ new ClauseItem('6') ]);
			seventh = new Proposition([ new ClauseItem('7') ]);
			second.priorChildren = [ first ];
			second.laterChildren = [ third, fourth ];
			fourth.partAfterArrow = sixth;
			sixth.priorChildren = [ fifth ];
			sixth.laterChildren = [ seventh ];
			pericope = new Pericope([ second ], language);
		});

		it('be able to find top level Proposition', () => {
			const accessor = ModelHelper.getContainingListInParent(pericope, second);

			expect(accessor.value).not.toEqual(List());
			expect(accessor.value).toBe(pericope.text);
			accessor.value = List();
			expect(accessor.value).toEqual(List());
			expect(accessor.value).toBe(pericope.text);
		});

		it('be able to find prior child Proposition', () => {
			const accessor = ModelHelper.getContainingListInParent(second, first);

			expect(accessor.value).not.toEqual(List.of(fourth));
			expect(accessor.value).toBe(second.priorChildren);
			accessor.value = List.of(fourth);
			expect(accessor.value).toEqual(List.of(fourth));
			expect(accessor.value).toBe(second.priorChildren);
		});

		it('be able to find later child Proposition', () => {
			const accessor = ModelHelper.getContainingListInParent(second, fourth);

			expect(accessor.value).not.toEqual(List.of(third));
			expect(accessor.value).toBe(second.laterChildren);
			accessor.value = List.of(third);
			expect(accessor.value).toEqual(List.of(third));
			expect(accessor.value).toBe(second.laterChildren);
		});

		it('be able to find partAfterArrow\'s prior child Proposition', () => {
			const accessor = ModelHelper.getContainingListInParent(fourth, fifth);

			expect(accessor.value).not.toEqual(List.of(second));
			expect(accessor.value).toBe(sixth.priorChildren);
			accessor.value = List.of(second);
			expect(accessor.value).toEqual(List.of(second));
			expect(accessor.value).toBe(sixth.priorChildren);
		});

		it('be able to find partAfterArrow\'s later child Proposition', () => {
			const accessor = ModelHelper.getContainingListInParent(fourth, seventh);

			expect(accessor.value).not.toEqual(List.of(first));
			expect(accessor.value).toBe(sixth.laterChildren);
			accessor.value = List.of(first);
			expect(accessor.value).toEqual(List.of(first));
			expect(accessor.value).toBe(sixth.laterChildren);
		});

		it('failing to find subordinated Proposition in Pericope', () => {
			const accessor = ModelHelper.getContainingListInParent(pericope, first);

			expect(accessor).toBe(null);
		});

		it('failing to find Proposition in wrong parent Proposition', () => {
			const accessor = ModelHelper.getContainingListInParent(sixth, first);

			expect(accessor).toBe(null);
		});

		it('failing to find partAfterArrow in its parent Proposition', () => {
			const accessor = ModelHelper.getContainingListInParent(second, sixth);

			expect(accessor).toBe(null);
		});
	});

	describe('addChildBeforeFollower()', () => {
		let first, second, third, fourth, fifth;

		beforeEach(function() {
			first = new Proposition([ new ClauseItem('1') ]);
			second = new Proposition([ new ClauseItem('2') ]);
			third = new Proposition([ new ClauseItem('3') ]);
			fourth = new Proposition([ new ClauseItem('4') ]);
			fifth = new Proposition([ new ClauseItem('5') ]);
		});

		it('be able to add Proposition before top level Proposition', () => {
			const pericope = new Pericope([ first, third, fourth, fifth ], language);
			second.syntacticFunction = language.functionGroups.first().first();
			ModelHelper.addChildBeforeFollower(pericope, second, third);

			expect(pericope.text.size).toBe(5);
			expect(pericope.text.first()).toBe(first);
			expect(pericope.text.get(1)).toBe(second);
			expect(pericope.text.get(2)).toBe(third);
			expect(pericope.text.get(3)).toBe(fourth);
			expect(pericope.text.last()).toBe(fifth);
			expect(second.syntacticFunction).toBe(null);
		});

		it('be able to add Proposition before prior child Proposition', () => {
			const syntacticFunction = language.functionGroups.first().first();
			second.syntacticFunction = syntacticFunction;
			fourth.priorChildren = [ third ];
			const pericope = new Pericope([ first, fourth, fifth ], language);
			ModelHelper.addChildBeforeFollower(fourth, second, third);

			expect(pericope.text.size).toBe(3);
			expect(pericope.text.first()).toBe(first);
			expect(fourth.priorChildren.first()).toBe(second);
			expect(fourth.priorChildren.last()).toBe(third);
			expect(pericope.text.get(1)).toBe(fourth);
			expect(pericope.text.last()).toBe(fifth);
			expect(second.syntacticFunction).toBe(syntacticFunction);
		});

		it('be able to add Proposition before enclosed child Proposition', () => {
			const syntacticFunction = language.functionGroups.first().first();
			second.syntacticFunction = syntacticFunction;
			fourth.priorChildren = [ third ];
			first.partAfterArrow = fourth;
			const pericope = new Pericope([ first, fifth ], language);
			ModelHelper.addChildBeforeFollower(fourth, second, third);

			expect(pericope.text.size).toBe(2);
			expect(pericope.text.first()).toBe(first);
			expect(fourth.priorChildren.first()).toBe(second);
			expect(fourth.priorChildren.last()).toBe(third);
			expect(first.partAfterArrow).toBe(fourth);
			expect(pericope.text.last()).toBe(fifth);
			expect(second.syntacticFunction).toBe(syntacticFunction);
		});

		it('be able to add Proposition before later child Proposition', () => {
			const syntacticFunction = language.functionGroups.first().first();
			second.syntacticFunction = syntacticFunction;
			first.laterChildren = [ third ];
			const pericope = new Pericope([ first, fourth, fifth ], language);
			ModelHelper.addChildBeforeFollower(first, second, third);

			expect(pericope.text.size).toBe(3);
			expect(pericope.text.first()).toBe(first);
			expect(first.laterChildren.first()).toBe(second);
			expect(first.laterChildren.last()).toBe(third);
			expect(pericope.text.get(1)).toBe(fourth);
			expect(pericope.text.last()).toBe(fifth);
			expect(second.syntacticFunction).toBe(syntacticFunction);
		});

		it('be able to add Proposition before later child Proposition of partAfterArrow', () => {
			const syntacticFunction = language.functionGroups.first().first();
			fourth.syntacticFunction = syntacticFunction;
			first.partAfterArrow = third;
			third.priorChildren = [ second ];
			third.laterChildren = [ fifth ];
			const pericope = new Pericope([ first ], language);
			ModelHelper.addChildBeforeFollower(first, fourth, fifth);

			expect(pericope.text.size).toBe(1);
			expect(third.priorChildren.first()).toBe(second);
			expect(first.partAfterArrow).toBe(third);
			expect(third.laterChildren.first()).toBe(fourth);
			expect(third.laterChildren.last()).toBe(fifth);
			expect(fourth.syntacticFunction).toBe(syntacticFunction);
		});
	});

	describe('addChildAfterPrior()', () => {
		let first, second, third, fourth, fifth;

		beforeEach(function() {
			first = new Proposition([ new ClauseItem('1') ]);
			second = new Proposition([ new ClauseItem('2') ]);
			third = new Proposition([ new ClauseItem('3') ]);
			fourth = new Proposition([ new ClauseItem('4') ]);
			fifth = new Proposition([ new ClauseItem('5') ]);
		});

		it('be able to add Proposition after top level Proposition', () => {
			const pericope = new Pericope([ first, second, fourth, fifth ], language);
			third.syntacticFunction = language.functionGroups.first().first();
			ModelHelper.addChildAfterPrior(pericope, third, second);

			expect(pericope.text.size).toBe(5);
			expect(pericope.text.first()).toBe(first);
			expect(pericope.text.get(1)).toBe(second);
			expect(pericope.text.get(2)).toBe(third);
			expect(pericope.text.get(3)).toBe(fourth);
			expect(pericope.text.last()).toBe(fifth);
			expect(third.syntacticFunction).toBe(null);
		});

		it('be able to add Proposition after prior child Proposition', () => {
			const syntacticFunction = language.functionGroups.first().first();
			third.syntacticFunction = syntacticFunction;
			fourth.priorChildren = [ second ];
			const pericope = new Pericope([ first, fourth, fifth ], language);
			ModelHelper.addChildAfterPrior(fourth, third, second);

			expect(pericope.text.size).toBe(3);
			expect(pericope.text.first()).toBe(first);
			expect(fourth.priorChildren.first()).toBe(second);
			expect(fourth.priorChildren.last()).toBe(third);
			expect(pericope.text.get(1)).toBe(fourth);
			expect(pericope.text.last()).toBe(fifth);
			expect(third.syntacticFunction).toBe(syntacticFunction);
		});

		it('be able to add Proposition after enclosed child Proposition', () => {
			const syntacticFunction = language.functionGroups.first().first();
			third.syntacticFunction = syntacticFunction;
			fourth.priorChildren = [ second ];
			first.partAfterArrow = fourth;
			const pericope = new Pericope([ first, fifth ], language);
			ModelHelper.addChildAfterPrior(fourth, third, second);

			expect(pericope.text.size).toBe(2);
			expect(pericope.text.first()).toBe(first);
			expect(fourth.priorChildren.first()).toBe(second);
			expect(fourth.priorChildren.last()).toBe(third);
			expect(first.partAfterArrow).toBe(fourth);
			expect(pericope.text.last()).toBe(fifth);
			expect(third.syntacticFunction).toBe(syntacticFunction);
		});

		it('be able to add Proposition after later child Proposition', () => {
			const syntacticFunction = language.functionGroups.first().first();
			third.syntacticFunction = syntacticFunction;
			first.laterChildren = [ second ];
			const pericope = new Pericope([ first, fourth, fifth ], language);
			ModelHelper.addChildAfterPrior(first, third, second);

			expect(pericope.text.size).toBe(3);
			expect(pericope.text.first()).toBe(first);
			expect(first.laterChildren.first()).toBe(second);
			expect(first.laterChildren.last()).toBe(third);
			expect(pericope.text.get(1)).toBe(fourth);
			expect(pericope.text.last()).toBe(fifth);
			expect(third.syntacticFunction).toBe(syntacticFunction);
		});

		it('be able to add Proposition after later child Proposition of partAfterArrow', () => {
			const syntacticFunction = language.functionGroups.first().first();
			fifth.syntacticFunction = syntacticFunction;
			first.partAfterArrow = third;
			third.priorChildren = [ second ];
			third.laterChildren = [ fourth ];
			const pericope = new Pericope([ first ], language);
			ModelHelper.addChildAfterPrior(first, fifth, fourth);

			expect(pericope.text.size).toBe(1);
			expect(third.priorChildren.first()).toBe(second);
			expect(first.partAfterArrow).toBe(third);
			expect(third.laterChildren.first()).toBe(fourth);
			expect(third.laterChildren.last()).toBe(fifth);
			expect(fifth.syntacticFunction).toBe(syntacticFunction);
		});
	});

	describe('removeChild()', () => {
		let first, second, third, fourth, fifth, extra;

		beforeEach(function() {
			first = new Proposition([ new ClauseItem('1') ]);
			second = new Proposition([ new ClauseItem('2') ]);
			third = new Proposition([ new ClauseItem('3') ]);
			fourth = new Proposition([ new ClauseItem('4') ]);
			fifth = new Proposition([ new ClauseItem('5') ]);
			extra = new Proposition([ new ClauseItem('to Remove') ]);
		});

		it('be able to remove top level Proposition', () => {
			const pericope = new Pericope([ first, second, third, fourth, extra, fifth], language);
			expect(ModelHelper.getFlatText(pericope).includes(extra));
			ModelHelper.removeChild(pericope, extra);

			expect(pericope.text.size).toBe(5);
			expect(pericope.text.first()).toBe(first);
			expect(pericope.text.get(1)).toBe(second);
			expect(pericope.text.get(2)).toBe(third);
			expect(pericope.text.get(3)).toBe(fourth);
			expect(pericope.text.last()).toBe(fifth);
		});

		it('be able to remove prior child Proposition', () => {
			fourth.priorChildren = [ second, extra, third ];
			const pericope = new Pericope([ first, fourth, fifth], language);
			expect(ModelHelper.getFlatText(pericope).includes(extra));
			ModelHelper.removeChild(fourth, extra);

			expect(pericope.text.size).toBe(3);
			expect(pericope.text.first()).toBe(first);
			expect(fourth.priorChildren.size).toBe(2);
			expect(fourth.priorChildren.first()).toBe(second);
			expect(fourth.priorChildren.last()).toBe(third);
			expect(pericope.text.get(1)).toBe(fourth);
			expect(pericope.text.last()).toBe(fifth);
		});

		it('be able to remove later child Proposition', () => {
			second.laterChildren = [ extra, third, fourth ];
			const pericope = new Pericope([ first, second, fifth], language);
			expect(ModelHelper.getFlatText(pericope).includes(extra));
			ModelHelper.removeChild(second, extra);

			expect(pericope.text.size).toBe(3);
			expect(pericope.text.first()).toBe(first);
			expect(pericope.text.get(1)).toBe(second);
			expect(second.laterChildren.size).toBe(2);
			expect(second.laterChildren.first()).toBe(third);
			expect(second.laterChildren.last()).toBe(fourth);
			expect(pericope.text.last()).toBe(fifth);
		});

		it('be able to remove partAfterArrow\'s prior child Proposition', () => {
			fourth.priorChildren = [ second, extra, third ];
			first.partAfterArrow = fourth;
			const pericope = new Pericope([ first, fifth], language);
			expect(ModelHelper.getFlatText(pericope).includes(extra));
			ModelHelper.removeChild(first, extra);

			expect(pericope.text.size).toBe(2);
			expect(pericope.text.first()).toBe(first);
			expect(fourth.priorChildren.size).toBe(2);
			expect(fourth.priorChildren.first()).toBe(second);
			expect(fourth.priorChildren.last()).toBe(third);
			expect(first.partAfterArrow).toBe(fourth);
			expect(pericope.text.last()).toBe(fifth);
		});

		it('be able to remove partAfterArrow\'s later child Proposition', () => {
			third.priorChildren = [ second ];
			first.partAfterArrow = third;
			third.laterChildren = [ fourth, fifth, extra ];
			const pericope = new Pericope([ first ], language);
			expect(ModelHelper.getFlatText(pericope).includes(extra));
			ModelHelper.removeChild(first, extra);

			expect(pericope.text.size).toBe(1);
			expect(pericope.text.first()).toBe(first);
			expect(third.priorChildren.first()).toBe(second);
			expect(first.partAfterArrow).toBe(third);
			expect(third.laterChildren.size).toBe(2);
			expect(third.laterChildren.first()).toBe(fourth);
			expect(third.laterChildren.last()).toBe(fifth);
		});

		it('be able to remove partAfterArrow Proposition', () => {
			extra.priorChildren = [ second ];
			first.partAfterArrow = extra;
			const pericope = new Pericope([ first, third, fourth, fifth ], language);
			expect(ModelHelper.getFlatText(pericope).includes(extra));
			ModelHelper.removeChild(first, extra);

			const flatText = ModelHelper.getFlatText(pericope).cacheResult();
			expect(flatText.count()).toBe(4);
			expect(flatText.first()).toBe(first);
			expect(flatText.get(1)).toBe(third);
			expect(flatText.get(2)).toBe(fourth);
			expect(flatText.last()).toBe(fifth);
			expect(first.partAfterArrow).toBe(null);
			expect(pericope.text.size).toBe(4);
			expect(pericope.text.first()).toBe(first);
			expect(pericope.text.get(1)).toBe(third);
			expect(pericope.text.get(2)).toBe(fourth);
			expect(pericope.text.last()).toBe(fifth);
		});

		it('failing to remove subordinated Proposition from Pericope', () => {
			second.laterChildren = [ extra, third ];
			const pericope = new Pericope([ first, second, fourth, fifth ], language);
			expect(ModelHelper.getFlatText(pericope).includes(extra));
			expect(() => ModelHelper.removeChild(pericope, extra))
					.toThrowError();
		});

		it('failing to remove Proposition from wrong parent Proposition', () => {
			second.laterChildren = [ extra, third ];
			const pericope = new Pericope([ first, second, fourth, fifth ], language);
			expect(ModelHelper.getFlatText(pericope).includes(extra));
			expect(() => ModelHelper.removeChild(third, extra))
					.toThrowError();
		});
	});

	xdescribe('isPriorOf()', () => {
		// this method is tested implicitely by the tests for the ModelChanger
	});

	xdescribe('getFollowingProposition()', () => {
		// this method is tested implicitely by the tests for the ModelChanger
	});

	xdescribe('getFollowingPropositionOnSameOrHigherLevel()', () => {
		// this method is tested implicitely by the tests for the ModelChanger
	});

	describe('Pericope > copyPlainPericope() > copyMutablePericope() = Pericope', () => {
		let first, second, third, fourth, fifth;

		beforeEach(function() {
			first = new Proposition([ new ClauseItem('1.1'), new ClauseItem('1.2'), new ClauseItem('1.3'), new ClauseItem('1.4') ]);
			second = new Proposition([ new ClauseItem('2') ]);
			third = new Proposition([ new ClauseItem('3') ]);
			fourth = new Proposition([ new ClauseItem('4') ]);
			fifth = new Proposition([ new ClauseItem('5') ]);
		});

		it('handle top level Propositions', () => {
			first.clauseItems.first().syntacticFunction = language.functionGroups.first().first();
			first.clauseItems.get(1).syntacticFunction = language.functionGroups.first().get(1);
			first.clauseItems.get(1).comment = 'Some comment';
			first.clauseItems.last().comment = 'Other comment';
			second.label = '2nd';
			third.syntacticTranslation = 'direct translation';
			fourth.semanticTranslation = 'meaning';
			fifth.comment = 'What the author actually wanted to say...';
			const pericope = new Pericope([ first, second, third, fourth, fifth ], language);
			const plain = ModelHelper.copyPlainPericope(pericope);
			const result = ModelHelper.copyMutablePericope(plain);

			expect(result).toEqual(pericope);
		});

		it('handle single child Propositions', () => {
			first.laterChildren = [ second ];
			third.priorChildren = [ first ];
			third.laterChildren = [ fifth ];
			fifth.priorChildren = [ fourth ];
			const pericope = new Pericope([ third ], language);
			const plain = ModelHelper.copyPlainPericope(pericope);
			const result = ModelHelper.copyMutablePericope(plain);

			expect(result).toEqual(pericope);
		});

		it('handle multiple child Propositions', () => {
			first.laterChildren = [ second, third ];
			fifth.priorChildren = [ first, fourth ];
			const pericope = new Pericope([ fifth ], language);
			const plain = ModelHelper.copyPlainPericope(pericope);
			const result = ModelHelper.copyMutablePericope(plain);

			expect(result).toEqual(pericope);
		});

		it('handle nested child Propositions with a partAfterArrow', () => {
			first.partAfterArrow = fourth;
			second.laterChildren = [ third ];
			fourth.priorChildren = [ second ];
			const pericope = new Pericope([ first, fifth ], language);
			const plain = ModelHelper.copyPlainPericope(pericope);
			const result = ModelHelper.copyMutablePericope(plain);

			expect(result).toEqual(pericope);
		});

		it('handle multiple partAfterArrows', () => {
			first.partAfterArrow = third;
			third.priorChildren = [ second ];
			third.partAfterArrow = fifth;
			fifth.priorChildren = [ fourth ];
			const pericope = new Pericope([ first ], language);
			const plain = ModelHelper.copyPlainPericope(pericope);
			const result = ModelHelper.copyMutablePericope(plain);

			expect(result).toEqual(pericope);
		});

		it('handle Relations', () => {
			const relation23 = new Relation([ second, third ], {
				getAssociateRoles: () => [ new AssociateRole('B', true), new AssociateRole('C', false) ]
			});
			const relation2to5 = new Relation([ relation23, fourth, fifth ], {
				getAssociateRoles: () => [ new AssociateRole('L', false), new AssociateRole('H', true), new AssociateRole('L', false) ]
			});
			const pericope = new Pericope([ first, second, third, fourth, fifth ], language);
			const plain = ModelHelper.copyPlainPericope(pericope);
			const result = ModelHelper.copyMutablePericope(plain);

			expect(result).toEqual(pericope);
			const secondProposition = ModelHelper.getFlatText(result).get(1);
			expect(secondProposition).not.toBe(second);
			expect(secondProposition).toEqual(second);
			expect(secondProposition.superOrdinatedRelation).not.toBe(relation23);
			expect(secondProposition.superOrdinatedRelation).toEqual(relation23);
			expect(secondProposition.superOrdinatedRelation.superOrdinatedRelation).not.toBe(relation2to5);
			expect(secondProposition.superOrdinatedRelation.superOrdinatedRelation).toEqual(relation2to5);
		});

		it('handle nested child Propositions with a partAfterArrow and Relations', () => {
			first.partAfterArrow = fourth;
			second.laterChildren = [ third ];
			fourth.priorChildren = [ second ];
			const relation12 = new Relation([ first, second ], {
				getAssociateRoles: () => [ new AssociateRole('A', false), new AssociateRole('B', true) ]
			});
			const relation35 = new Relation([ third, fifth ], {
				getAssociateRoles: () => [ new AssociateRole('L', false), new AssociateRole('H', true), new AssociateRole('L', false) ]
			});
			const relation1to5 = new Relation([ relation12, relation35 ], {
				getAssociateRoles: () => [ new AssociateRole('X', true), new AssociateRole('X', true) ]
			});
			const pericope = new Pericope([ first, fifth ], language);
			const plain = ModelHelper.copyPlainPericope(pericope);
			const result = ModelHelper.copyMutablePericope(plain);

			expect(result).toEqual(pericope);
			const firstProposition = ModelHelper.getFlatText(result).first();
			expect(firstProposition).not.toBe(first);
			expect(firstProposition).toEqual(first);
			expect(firstProposition.superOrdinatedRelation).not.toBe(relation12);
			expect(firstProposition.superOrdinatedRelation).toEqual(relation12);
			expect(firstProposition.superOrdinatedRelation.superOrdinatedRelation).not.toBe(relation1to5);
			expect(firstProposition.superOrdinatedRelation.superOrdinatedRelation).toEqual(relation1to5);
		});
	});
});
