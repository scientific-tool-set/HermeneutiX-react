import React from 'react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { storiesOf, action } from '@kadira/storybook';

import 'bootstrap/dist/css/bootstrap.min.css'
import '../../style/style.css';

import rootReducer from '../../src/reducers';
import LanguageModel from '../../src/pericope/model/languageModel';
import SyntacticFunction from '../../src/pericope/model/syntacticFunction';
import SynProposition from '../../src/components/syntacticProposition';

const store = createStore(rootReducer, {
	pericope: {
		language: new LanguageModel('Test', true, [ [ ] ]),
		text: [
			{
				index: 0,
				priorChildren: [ ],
				label: 'Label',
				clauseItems: [
					{ originText: 'Text1', syntacticFunction: new SyntacticFunction('Syn Func', 'SF') },
					{ originText: 'Text2' },
					{ originText: 'Text3' },
					{ originText: 'Text4', syntacticFunction: new SyntacticFunction('Func4', 'S-F-4', true) }
				],
				syntacticTranslation: 'Syntactic Translation',
				laterChildren: [ ]
			}
		],
		connectables: [
			{ index: 0 }
		]
	}
});

storiesOf('SynProposition', module)
	.addDecorator(getStory => (
		<Provider store={store}>
			{ getStory() }
		</Provider>
	))
	.add('default', () => {
		const proposition = store.getState().pericope.text[0];
		return (
			<ul>
				<SynProposition checked={true} { ...proposition } />
			</ul>
		);
	});
