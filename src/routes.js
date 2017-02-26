import React from 'react';
import { Route, IndexRoute } from 'react-router';

import App from './components/app';
import WelcomeView from './components/welcome_view';

export default (
	<Route path="/" component={App}>
		<IndexRoute component={WelcomeView} />
	</Route>
);
