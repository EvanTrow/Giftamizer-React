import React from 'react';
import { Link } from 'react-router-dom';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
// import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Typography from '@material-ui/core/Typography';

import Alert from '../../../Alert';
import Snackbar from '@material-ui/core/Snackbar';

export default function GroupCard({ group, list, getMembers, owner }) {
	const [alert, setAlert] = React.useState({ open: false, message: '', severity: 'info' });
	const handleAlertClose = (event, reason) => {
		setAlert({ open: false, message: alert.message, severity: alert.severity });
	};

	return (
		<div>
			<Card>
				<CardActionArea component={Link} to={'/gift/group/' + group + '/member/' + list.owner + '/list/' + list.id}>
					<CardMedia style={{ fontSize: '1000%', textAlign: 'center', backgroundColor: '#4caf50', color: '#fff' }}>{list.name.charAt(0).toUpperCase()}</CardMedia>
					<CardContent>
						<Typography gutterBottom variant='h5' component='h2'>
							{list.name}
						</Typography>
					</CardContent>
				</CardActionArea>
				{/* {owner && (
					<CardActions>
						<Remove member={list.id} group={group} getMembers={getMembers} setAlert={setAlert} />
					</CardActions>
				)} */}
			</Card>

			<Snackbar open={alert.open} autoHideDuration={3500} onClose={handleAlertClose}>
				<Alert onClose={handleAlertClose} severity={alert.severity}>
					{alert.message}
				</Alert>
			</Snackbar>
		</div>
	);
}