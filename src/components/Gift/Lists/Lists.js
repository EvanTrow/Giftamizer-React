import React from 'react';
import { Link } from 'react-router-dom';

import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import Alert from '@mui/material/Alert';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';

import CreateList from './Create';

import { GroupChip } from '../../../firebase/gift/misc';

import ListAltIcon from '@mui/icons-material/ListAlt';

import { firebaseAuth } from '../../../firebase/constants';

class Landing extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			lists: [],
			loading: true,

			showAssignError: false,
		};
		props.setTitle('My Lists');
	}

	componentDidMount() {
		// this.props.socket.emit('join', 'myLists:' + firebaseAuth().currentUser.uid);
		this.getlists();
	}

	getlists = () => {
		this.props.socket.emit('req:listsData', firebaseAuth().currentUser.uid);
		this.props.socket.on('res:listsData', (result) => {
			console.log(result);

			if (result) {
				this.setState({
					lists: result,
					loading: false,
				});

				var showAssignError = false;
				result.forEach((lists) => {
					if (lists.groups.length === 0) {
						showAssignError = true;
					}
				});
				this.setState({
					showAssignError: showAssignError,
				});
			} else {
				this.setState({
					loading: false,
				});
			}
		});
	};

	componentWillUnmount() {
		// this.props.socket.emit('leave', 'myLists:' + firebaseAuth().currentUser.uid);
		this.props.socket.off('req:listsData');
	}

	render() {
		return (
			<div>
				<Container style={{ paddingTop: 20, marginBottom: 96 }}>
					{this.state.showAssignError && (
						<Alert severity='warning' style={{ marginBottom: 16 }}>
							<b>A list is not assigned to a group!</b> — In order for items to show up in groups they must be assigned to a list and lists must be assigned to a group.
							<b> Add a group in the list settings.</b>
						</Alert>
					)}
					<List>
						{this.state.lists.map((list, i) => (
							<ListItem button component={Link} to={'/gift/list/' + list._id} style={list.groups.length === 0 ? { background: '#f4433666' } : {}}>
								<ListItemAvatar>
									<Avatar>{list.isForChild ? <i className='fas fa-baby-carriage' style={{ fontSize: '1.19rem', marginLeft: 2 }} /> : <ListAltIcon />}</Avatar>
								</ListItemAvatar>
								<ListItemText
									primary={list.name}
									secondary={
										<>
											{list.groups.map((list, i) => (
												<GroupChip groupId={list} />
											))}
											{list.groups.length === 0 && <b>This list assigned to a group!</b>}
										</>
									}
								/>
							</ListItem>
						))}
					</List>
					{this.state.lists.length === 0 && !this.state.loading && (
						<Typography variant='h5' gutterBottom style={{ position: 'absolute', top: 200, left: '50%', marginRight: '-50%', transform: 'translate(-50%, -50%)' }}>
							You don't have any lists.
						</Typography>
					)}
				</Container>
				<CreateList getlists={this.getlists} isMobile={this.props.isMobile} />
			</div>
		);
	}
}

export default Landing;