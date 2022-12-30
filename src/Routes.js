import React, { Component } from 'react';

import socketIOClient from 'socket.io-client';

import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';

import { firebaseAuth, endpoint } from './firebase/constants';

import Landing from './components/Landing';
import Signin from './components/Signin/Signin';
import Signup from './components/Signin/Signup';
import Forgot from './components/Signin/Forgot';
import Gift from './components/Gift/Gift';

import PrivacyPolicy from './components/PrivacyPolicy';
import TermsConditions from './components/TermsConditions';

var socket; // define socket

function PrivateRoute({ component: Component, authed, ...rest }) {
	return <Route {...rest} render={(props) => (authed ? <Component {...props} /> : <Redirect to={{ pathname: '/signin', state: { from: props.location } }} />)} />;
}

function PublicRoute({ component: Component, authed, ...rest }) {
	return <Route {...rest} render={(props) => (authed ? <Redirect to='/gift' /> : <Component {...props} />)} />;
}

export const admins = [
	'jwpIwFNoPKh2YwRCbTkAJZypXyx2', // Trowbridge
	'iBmdSh5eh0VnyqCv4btfl21MpNx2', // Templin
	'9ke7mnGJtqVeWBGIhcF8tMcVGgY2', // Phyillaier
];

export default class App extends Component {
	constructor(props) {
		super(props);
		this.state = {
			authed: false,
			loading: true,
			user: null,

			maintenance: false,
		};

		socket = socketIOClient(endpoint); // initialize socket

		// this.prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

		firebaseAuth().onAuthStateChanged((user) => {
			if (user) {
				this.setState({
					user: user,
					authed: true,
					loading: false,
				});
			} else {
				this.setState({
					user: null,
					authed: false,
					loading: false,
				});
			}
		});
	}

	componentDidMount() {
		this.listenForMainance();
	}

	listenForMainance = () => {
		socket.emit('join', 'maintenance');
		socket.emit('req:maintenance', null);
		socket.on('res:maintenance', (doc) => {
			// console.log(doc);

			this.setState({
				maintenance: doc.status,
			});
		});
	};

	render() {
		return this.state.loading === true ? (
			<>
				<CircularProgress style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, margin: 'auto' }} />
			</>
		) : this.state.maintenance === true && !admins.includes(this.state?.user?.uid) ? (
			<div style={{ textAlign: 'center', padding: 20, font: '20px Helvetica, sans-serif' }}>
				<article style={{ display: 'block', textAlign: 'left', width: '90%', margin: '0 auto' }}>
					<h1 style={{ fontSize: '50px' }}>We&rsquo;ll be back soon!</h1>
					<div>
						<p>Sorry for the inconvenience but we&rsquo;re performing some maintenance at the moment. We&rsquo;ll be back online shortly!</p>
						<p>&mdash; Evan</p>
					</div>
				</article>
			</div>
		) : (
			<>
				<BrowserRouter>
					<Switch>
						<PublicRoute authed={this.state.authed} exact path='/' component={Landing} />
						<Route exact path='/policy' component={PrivacyPolicy} />
						<Route exact path='/terms' component={TermsConditions} />
						<PublicRoute authed={this.state.authed} exact path='/signin' component={Signin} />
						<PublicRoute authed={this.state.authed} exact path='/signup' component={Signup} />
						<PublicRoute authed={this.state.authed} exact path='/forgot' component={Forgot} />
						<PrivateRoute authed={this.state.authed} path='/gift' component={(props) => <Gift {...props} user={this.state.user} socket={socket} />} />
					</Switch>
				</BrowserRouter>
			</>
		);
	}
}