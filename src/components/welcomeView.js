import React from 'react';
import { Link } from 'react-router';

export default () => (
	<div className='container-fluid'>
		<h3>Welcome to SciToS – HermeneutiX</h3>
		<Link to='/input' className='btn btn-primary'>
			{'Create new HermeneutiX Project'}
		</Link>
	</div>
);
