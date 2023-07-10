import * as React from 'react';

import { useSnackbar } from 'notistack';
import { TransitionProps } from '@mui/material/transitions';
import { Close, Person, Save } from '@mui/icons-material';

import {
	Alert,
	AlertTitle,
	AppBar,
	Button,
	Container,
	Dialog,
	Divider,
	Grid,
	IconButton,
	Link as MUILink,
	ListItemIcon,
	MenuItem,
	Slide,
	TextField,
	Toolbar,
	Typography,
	DialogActions,
	DialogContent,
	DialogTitle,
	CircularProgress,
} from '@mui/material';
import { useGetProfile, useSupabase, useUpdateProfile } from '../lib/useSupabase';
import AvatarEditor from './AvatarEditor';
import EmailEditor from './EmailEditor';
import { Link } from 'react-router-dom';

const Transition = React.forwardRef(function Transition(
	props: TransitionProps & {
		children: React.ReactElement;
	},
	ref: React.Ref<unknown>
) {
	return <Slide direction='left' ref={ref} {...props} />;
});

export interface GroupsWithoutCoOwner {
	id: string;
	name: string;
	owner_count: number;
}

export type AccountDialogProps = {
	handleCloseMenu?(): void;
};

export default function AccountDialog(props: AccountDialogProps) {
	const { enqueueSnackbar } = useSnackbar();

	const { client, user } = useSupabase();
	const { data: profile } = useGetProfile();

	const [open, setOpen] = React.useState(false);

	const [firstName, setFirstName] = React.useState('');
	const [lastName, setLastName] = React.useState('');
	const [bio, setBio] = React.useState('');

	const [groupsWithoutCoOwner, setGroupsWithoutCoOwner] = React.useState<GroupsWithoutCoOwner[] | undefined>();
	const [deleteOpen, setDeleteOpen] = React.useState(false);

	const handleClickOpen = async () => {
		if (props.handleCloseMenu) props.handleCloseMenu();

		if (profile) {
			setFirstName(profile?.first_name);
			setLastName(profile?.last_name);
			setBio(profile?.bio);
			setOpen(true);
		}

		const { data, error } = await client.rpc('get_groups_without_coowner', { owner_id: user.id });

		if (error) {
			console.log(error);

			enqueueSnackbar('Unable to query groups you own!', {
				variant: 'error',
			});
		} else {
			setGroupsWithoutCoOwner(data! as GroupsWithoutCoOwner[]);
		}
	};

	const handleClose = () => {
		setOpen(false);
	};

	const updateProfile = useUpdateProfile();
	const handleSave = async () => {
		updateProfile
			.mutateAsync({
				first_name: firstName,
				last_name: lastName,
				bio: bio,
				avatar_token: profile?.avatar_token!,
			})
			.then(() => {
				setOpen(false);
			})
			.catch((error) => {
				enqueueSnackbar(`Unable to update your profile. ${error}`, {
					variant: 'error',
				});
			});
	};

	const handleImageTokenUpdate = async (token: number | null) => {
		updateProfile
			.mutateAsync({
				first_name: firstName,
				last_name: lastName,
				bio: bio,
				avatar_token: token,
			})
			.catch((error) => {
				enqueueSnackbar(`Unable to update your profile image token. ${error}`, {
					variant: 'error',
				});
			});
	};

	const handleDelete = async () => {
		const { data, error } = await client.functions.invoke('user/delete', {
			body: {
				user_id: user.id,
			},
		});

		if (error) {
			console.log(error);
			enqueueSnackbar(`Unable to delete your account. ${error}`, {
				variant: 'error',
			});
		}

		if (data === 'ok') {
			client.auth.signOut();
			enqueueSnackbar(`Your Giftamizer account and users data has been deleted.`, {
				variant: 'success',
			});
		}
	};

	return (
		<>
			<MenuItem onClick={handleClickOpen}>
				<ListItemIcon>
					<Person fontSize='small' />
				</ListItemIcon>
				<Typography textAlign='center'>My Account</Typography>
			</MenuItem>

			<Dialog onKeyDown={(e) => e.stopPropagation()} fullScreen open={open} onClose={handleClose} TransitionComponent={Transition}>
				<AppBar sx={{ position: 'relative' }} enableColorOnDark>
					<Toolbar>
						<IconButton edge='start' color='inherit' onClick={handleClose} aria-label='close'>
							<Close />
						</IconButton>
						<Typography sx={{ ml: 2, flex: 1 }} variant='h6' component='div'>
							My Account
						</Typography>
						<IconButton edge='start' color='inherit' onClick={handleSave} aria-label='close' disabled={updateProfile.isLoading}>
							{updateProfile.isLoading ? <CircularProgress size={20} color='inherit' /> : <Save />}
						</IconButton>
					</Toolbar>
				</AppBar>
				<Container maxWidth='md' sx={{ marginTop: 6 }}>
					<Grid container spacing={2}>
						<Grid item xs={12}>
							<AvatarEditor bucket='avatars' filepath={user.id} imageToken={profile?.avatar_token!} handleTokenUpdate={handleImageTokenUpdate} />
						</Grid>
						<Grid item xs={6}>
							<TextField fullWidth label='First Name' variant='outlined' value={firstName} onChange={(e) => setFirstName(e.target.value)} />
						</Grid>
						<Grid item xs={6}>
							<TextField fullWidth label='Last Name' variant='outlined' value={lastName} onChange={(e) => setLastName(e.target.value)} />
						</Grid>
						<Grid item xs={12}>
							<TextField
								fullWidth
								multiline
								minRows={3}
								maxRows={7}
								label='Bio'
								variant='outlined'
								inputProps={{ maxLength: 250 }}
								value={bio}
								onChange={(e) => setBio(e.target.value)}
								helperText={`${bio.length} / 250`}
							/>
						</Grid>

						{user.app_metadata.provider === 'email' && (
							<Grid item xs={12}>
								<EmailEditor />
							</Grid>
						)}

						<Grid item xs={12}>
							<Divider />
						</Grid>

						<Grid item xs={12}>
							<Typography variant='h6' gutterBottom>
								Danger Zone
							</Typography>
							<Alert severity='error'>
								<AlertTitle>Delete Account</AlertTitle>

								<Grid container spacing={2}>
									{groupsWithoutCoOwner && groupsWithoutCoOwner.length > 0 ? (
										<>
											<Grid item xs={12}>
												<Typography variant='body1'>
													Your account is currently an owner of {groupsWithoutCoOwner.length > 1 ? 'these groups' : 'this group'}:{' '}
													{groupsWithoutCoOwner.map((g, i) => (
														<>
															<MUILink component={Link} to={`/groups/${g.id}`} onClick={handleClose}>
																{g.name}
															</MUILink>
															{i !== groupsWithoutCoOwner.length - 1 && ', '}
														</>
													))}
												</Typography>
											</Grid>
											<Grid item xs={12}>
												<Typography variant='body1'>
													You must add another owner or delete {groupsWithoutCoOwner.length > 1 ? 'these groups' : 'this group'} before you can delete your account.
												</Typography>
											</Grid>
										</>
									) : (
										<Grid item xs={12}>
											<Typography variant='body1'>
												<b>This action is permanent! All user data will be deleted.</b>
											</Typography>
										</Grid>
									)}
									<Grid item xs={12}>
										<Button variant='outlined' color='error' disabled={!groupsWithoutCoOwner || groupsWithoutCoOwner.length > 0} onClick={() => setDeleteOpen(true)}>
											Delete My Account
										</Button>
									</Grid>
								</Grid>
							</Alert>
						</Grid>
					</Grid>
				</Container>
			</Dialog>

			<Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
				<DialogTitle>Delete Account</DialogTitle>
				<DialogContent>
					<Typography variant='body1'>
						<b>This action is permanent! All user data will be deleted.</b>
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button color='inherit' onClick={() => setDeleteOpen(false)}>
						Cancel
					</Button>
					<Button color='error' variant='contained' onClick={handleDelete}>
						Yes Delete my Account
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}
