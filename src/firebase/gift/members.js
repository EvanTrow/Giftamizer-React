import { firebaseAuth, endpoint } from '../constants';

import socketIOClient from 'socket.io-client';
var socket = socketIOClient(endpoint);

export function removeMember(groupId, userId) {
	return new Promise((resolve, reject) => {
		socket.emit('del:member', {
			user: firebaseAuth().currentUser.uid,
			groupId: groupId,
			userId: userId,
		});
		socket.on('res:del:member', (result) => {
			socket.off('res:del:member');
			resolve(result);
		});
	});
}