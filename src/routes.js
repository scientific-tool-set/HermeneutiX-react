import React from 'react';
import { Route, IndexRoute } from 'react-router';

import App from './components/app';
import WelcomeView from './components/welcomeView';

export default (
	<Route path="/" component={App}>
		<IndexRoute component={WelcomeView} />
	</Route>
);
