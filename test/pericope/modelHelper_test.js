import * as ModelHelper from '../../src/pericope/modelHelper';
import LanguageModel from '../../src/pericope/model/languageModel';
import SyntacticFunction from '../../src/pericope/model/syntacticFunction';
import SyntacticFunctionGroup from '../../src/pericope/model/syntacticFunctionGroup';
import Pericope from '../../src/pericope/model/pericope';
import Proposition from '../../src/pericope/model/proposition';
import ClauseItem from '../../src/pericope/model/clauseItem';

describe('ModelHelper', () => {
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
				const pericope = new Pericope([ first, second, third, fourth, fifth, sixth, seventh ], null);
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
				const pericope = new Pericope([ fourth ], null);
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
			const pericope = new Pericope([ first, second, seventh ], null);
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
			const pericope = new Pericope([ first, second, seventh ], null);
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
			const pericope = new Pericope([ first ], null);
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
			const pericope = new Pericope([ first ], null);
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
		// TODO: write tests
	});

	describe('addChildBeforeFollower()', () => {
		// TODO: write tests
	});

	describe('addChildAfterPrior()', () => {
		// TODO: write tests
	});

	describe('removeChild()', () => {
		// TODO: write tests
	});

	describe('removeRelation()', () => {
		// TODO: write tests
	});

	describe('isPriorOf()', () => {
		// TODO: write tests
	});

	describe('getFollowingProposition()', () => {
		// TODO: write tests
	});

	describe('getFollowingPropositionOnSameOrHigherLevel()', () => {
		// TODO: write tests
	});

	describe('Pericope > copyPlainPericope() > copyMutablePericope() = Pericope', () => {
		let first, second, third, fourth, fifth;
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
	});
});
