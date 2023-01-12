import React from 'react';

import { useSupabase } from '../lib/useSupabase';
import { useSnackbar } from 'notistack';

import { Avatar, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, Typography } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteIcon from '@mui/icons-material/Delete';

import { useDropzone } from 'react-dropzone';
import 'cropperjs/dist/cropper.css';
import Cropper from 'react-cropper';

export async function dataUrlToFile(dataUrl: string, fileName: string): Promise<File> {
	const res: Response = await fetch(dataUrl);
	const blob: Blob = await res.blob();
	return new File([blob], fileName, { type: 'image/jpeg' });
}

export default function AvatarEditor() {
	const cropperRef = React.useRef(null);
	const { getRootProps, getInputProps } = useDropzone({
		accept: {
			'image/*': ['.png', '.gif', '.jpeg', '.jpg'],
		},
		onDrop: (files) => {
			const reader = new FileReader();
			reader.readAsDataURL(files[0]);
			reader.onload = () => {
				setSelectedImage(String(reader.result));
			};
		},
	});
	const [selectedimage, setSelectedImage] = React.useState('');

	const { client, user, profile, updateProfile } = useSupabase();
	const { enqueueSnackbar } = useSnackbar();

	const [open, setOpen] = React.useState(false);
	const [loading, setLoading] = React.useState(false);

	const handleUpload = async () => {
		const imageElement: any = cropperRef?.current;
		const cropper: any = imageElement?.cropper;

		setLoading(true);
		const { error } = await client.storage.from('avatars').upload(`${profile.user_id}`, await dataUrlToFile(cropper.getCroppedCanvas().toDataURL(), 'avatar'), {
			cacheControl: '3600',
			upsert: true,
		});
		if (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} else {
			await updateProfile({
				avatar_token: `${Date.now()}`,
			});
		}

		handleClose();
	};

	const handleRemove = async () => {
		setLoading(true);

		const { error } = await client.storage.from('avatars').remove([`${profile.user_id}`]);
		if (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} else {
			await updateProfile({
				avatar_token: -1,
			});
		}

		handleClose();
	};

	const handleClose = async () => {
		setSelectedImage('');
		setOpen(false);
		setLoading(false);
	};

	return (
		<>
			<IconButton onClick={() => setOpen(true)}>
				<Avatar
					alt={profile.name}
					src={
						profile.avatar_token && profile.avatar_token !== -1
							? // @ts-ignore
							  `${client.supabaseUrl}/storage/v1/object/public/avatars/${user.id}?${profile.avatar_token}`
							: '/defaultAvatar.png'
					}
					sx={{ height: 196, width: 196 }}
				/>
			</IconButton>

			<Dialog open={open} onClose={() => setOpen(false)} maxWidth='sm' fullWidth>
				<DialogTitle>Update Profile Image</DialogTitle>
				<DialogContent>
					<Box>
						{selectedimage ? (
							<>
								<IconButton aria-label='clear' sx={{ position: 'absolute', zIndex: 1000, top: 66, right: 26 }} onClick={() => setSelectedImage('')}>
									<ClearIcon />
								</IconButton>
								<Cropper src={selectedimage} style={{ width: '100%' }} guides={true} ref={cropperRef} aspectRatio={1} />
							</>
						) : (
							<Paper
								sx={{
									textAlign: 'center',
									padding: 5,
									cursor: 'pointer',
								}}
								{...getRootProps({
									className: 'dropzone',
								})}
							>
								<input multiple={false} {...getInputProps()} />
								<Typography variant='body1' component='div' gutterBottom>
									Select or drop an Image
								</Typography>
								<FileUploadIcon />
							</Paper>
						)}
					</Box>
				</DialogContent>
				<DialogActions>
					{profile.avatar_token && (
						// <Button color='error' variant='contained' sx={{ position: 'absolute', left: 8 }} onClick={handleRemove}>
						// 	Remove
						// </Button>

						<LoadingButton
							color='error'
							variant='contained'
							sx={{ position: 'absolute', left: 8 }}
							onClick={handleRemove}
							endIcon={<DeleteIcon />}
							disabled={profile.avatar_token === null}
							loading={loading}
							loadingPosition='end'
						>
							Remove
						</LoadingButton>
					)}

					<Button color='inherit' onClick={handleClose}>
						Cancel
					</Button>

					<LoadingButton onClick={handleUpload} endIcon={<FileUploadIcon />} disabled={selectedimage === ''} loading={loading} loadingPosition='end' variant='contained'>
						Upload
					</LoadingButton>
				</DialogActions>
			</Dialog>
		</>
	);
}