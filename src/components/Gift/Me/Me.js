import React, { Component } from 'react';

import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';

import ColorTool from './ColorTool';

import CircularProgress from '@material-ui/core/CircularProgress';

import Snackbar from '@material-ui/core/Snackbar';
import Alert from '../../Alert';

import { db, firebaseAuth } from '../../../firebase/constants';

class Printing extends Component {
	constructor(props) {
		super(props);
		this.state = {
			user: firebaseAuth().currentUser.uid,

			main: '#4caf50',
			textShade: 'light',

			backgroundType: '',
			backgroundValue: '',

			image: '',

			loading: true,
		};
		props.setTitle('Theme');
	}

	componentDidMount() {
		this.getThemeSettings();
	}

	getThemeSettings = () => {
		var themeRef = db.collection('users').doc(firebaseAuth().currentUser.uid);

		themeRef
			.get()
			.then((doc) => {
				console.log(doc.data());
				if (doc.exists && doc.data().backgroundType && doc.data().backgroundValue) {
					this.setState({
						main: doc.data().backgroundValue,
						textShade: doc.data().textShade,
						backgroundType: doc.data().backgroundType,
						backgroundValue: doc.data().backgroundValue,
						displayName: doc.data().displayName,
						image: doc.data().image,
						loading: false,
					});
				} else {
					this.setState({
						displayName: doc.data().displayName,
						backgroundType: 'color',
						loading: false,
					});
				}
			})
			.catch((error) => {
				console.log('Error getting document:', error);
				this.setState({ loading: false });
			});
	};

	handleSnackbarClose = () => {
		this.setState({
			snackbarOpen: false,
			snackbarMessage: '',
		});
	};
	handleSnackbarOpen = (message, severity) => {
		this.setState({
			snackbarOpen: true,
			snackbarMessage: message,
			snackbarSeverity: severity,
		});
	};

	render() {
		return this.state.loading === true ? (
			<div>
				<CircularProgress style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, margin: 'auto' }} />
			</div>
		) : (
			<div>
				<Paper elevation={9} style={{ paddingLeft: 12, paddingRight: 12, margin: 8, marginTop: 20 }}>
					<Grid container spacing={3}>
						<Grid item xs={12}>
							<ColorTool settings={this.state} />
						</Grid>
					</Grid>
				</Paper>
				<Snackbar open={this.state.snackbarOpen} autoHideDuration={5000} onClose={this.handleSnackbarClose}>
					<Alert onClose={this.handleSnackbarClose} severity={this.state.snackbarSeverity}>
						{this.state.snackbarMessage}
					</Alert>
				</Snackbar>
			</div>
		);
	}
}

export default Printing;