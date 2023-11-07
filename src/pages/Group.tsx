import React from 'react';

import { useParams, useNavigate, Link, NavigateFunction } from 'react-router-dom';
import { useGetGroupMembers, useGetGroups, useGetLists, useGetProfile, useSetGroupPin } from '../lib/useSupabase';

import {
	Card,
	CardActionArea,
	CardContent,
	CardMedia,
	CircularProgress,
	Grid,
	Link as MUILink,
	Typography,
	Box,
	Breadcrumbs,
	AppBar,
	Toolbar,
	Checkbox,
	Grow,
	Container,
	Tooltip,
	Alert,
	Collapse,
} from '@mui/material';
import { PushPinOutlined, PushPin, EscalatorWarning } from '@mui/icons-material';

import GroupSettingsDialog from '../components/GroupSettingsDialog';
import NotFound from '../components/NotFound';
import { Member } from '../lib/useSupabase/types';
import { TransitionGroup } from 'react-transition-group';

interface RenderMemberProps {
	member: Member;
	navigate: NavigateFunction;
}
function RenderMember({ member, navigate }: RenderMemberProps) {
	const { group: groupID } = useParams();

	return (
		<Grid key={member.user_id} item xs sx={{ maxWidth: { xs: '100%', sm: 250 }, margin: 1 }}>
			<Card sx={{ height: '100%' }}>
				<CardActionArea sx={{ height: '100%', display: 'grid', alignItems: 'start' }} onClick={() => navigate(`/groups/${groupID}/${member.user_id}`)}>
					<CardMedia
						sx={{
							height: 250,
							width: { xs: 'calc(100vw - 48px)', sm: 250 },
							fontSize: 150,
							lineHeight: 1.7,
							textAlign: 'center',
							backgroundColor: '#5cb660',
							color: '#fff',
						}}
						image={member.profile.image}
					>
						{member.profile.image ? '' : Array.from(String(member.profile.first_name + member.profile.last_name).toUpperCase())[0]}
					</CardMedia>

					<CardContent>
						<Grid container>
							<Grid item xs>
								<Typography variant='h5' component='h2'>
									{member.profile.first_name} {member.profile.last_name}
								</Typography>
							</Grid>

							{member.child_list && (
								<Grid item>
									<EscalatorWarning />
								</Grid>
							)}
						</Grid>
					</CardContent>
				</CardActionArea>
			</Card>
		</Grid>
	);
}

export default function Group() {
	const navigate = useNavigate();
	const { group: groupID, user: userID } = useParams();

	const { data: profile } = useGetProfile();
	const { data: lists } = useGetLists();
	const { data: groups, isLoading: groupsLoading } = useGetGroups();
	const { data: members, isLoading: membersLoading } = useGetGroupMembers(groupID!);
	const setGroupPin = useSetGroupPin();

	return (
		<>
			{groupsLoading || membersLoading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', mt: 16 }}>
					<CircularProgress />
				</Box>
			) : (
				<>
					{!userID && groups?.find((g) => g.id === groupID && !g.my_membership[0].invite) ? (
						<>
							<AppBar position='static' sx={{ bgcolor: 'background.paper' }}>
								<Toolbar variant='dense'>
									<Breadcrumbs aria-label='breadcrumb' sx={{ flexGrow: 1 }}>
										<MUILink underline='hover' color='inherit' component={Link} to='/groups'>
											Groups
										</MUILink>
										<Typography color='text.primary'>{groups?.find((g) => g.id === groupID)?.name}</Typography>
									</Breadcrumbs>

									<Tooltip title={groups?.find((g) => g.id === groupID)?.my_membership[0].pinned ? 'Unpin' : 'Pin'} arrow>
										<Checkbox
											size='small'
											icon={setGroupPin.isLoading ? <CircularProgress size={20} /> : <PushPinOutlined />}
											checkedIcon={setGroupPin.isLoading ? <CircularProgress size={20} /> : <PushPin />}
											sx={{ mr: 1, display: { xs: 'none', sm: 'none', md: 'flex' } }}
											checked={groups?.find((g) => g.id === groupID)?.my_membership[0].pinned}
											onChange={(e) => {
												setGroupPin.mutateAsync({ id: groupID!, pinned: e.target.checked });
											}}
											disabled={setGroupPin.isLoading}
										/>
									</Tooltip>

									<GroupSettingsDialog group={groups?.find((g) => g.id === groupID)!} owner={groups?.find((g) => g.id === groupID)?.my_membership[0].owner!} />
								</Toolbar>
							</AppBar>
							<ListUnassignedAlert open={profile?.enable_lists && lists?.filter((l) => !l.child_list && l.groups.find((g) => g.id === groupID)).length === 0} />

							<Container sx={{ marginTop: 2, paddingBottom: 12 }}>
								<TransitionGroup component={Grid} container justifyContent='center'>
									{members
										?.filter((m) => !m.invite)
										.map((member, index) => (
											<Grow key={member.user_id} style={{ transitionDelay: `${index * 25}ms` }}>
												{RenderMember({ member: member, navigate: navigate })}
											</Grow>
										))}
								</TransitionGroup>

								{members?.filter((m) => !m.invite).length === 0 && (!groupsLoading || !membersLoading) && (
									<Typography variant='h5' gutterBottom style={{ marginTop: 100, textAlign: 'center' }}>
										This group has no members, invite some friends and family!
									</Typography>
								)}
							</Container>
						</>
					) : (
						<NotFound />
					)}
				</>
			)}
		</>
	);
}

interface ListUnassignedAlertProps {
	open?: boolean;
}
function ListUnassignedAlert({ open }: ListUnassignedAlertProps) {
	return (
		<Box sx={{ width: '100%' }}>
			<Collapse in={open}>
				<Collapse in={alert !== undefined}>
					<Alert severity='warning'>You are not sharing any lists with this group!</Alert>
				</Collapse>
			</Collapse>
		</Box>
	);
}
