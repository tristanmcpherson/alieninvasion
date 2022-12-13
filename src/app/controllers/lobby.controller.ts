import * as db from '../db/lobby.db.js';
import { IPlayer } from '../models/player.model.js';
import { ILobby } from '../models/lobby.model.js';
import { Socket } from 'socket.io';

export const disconnectPlayerIfInLobby = async (playerId: string, socket: Socket) => {

	

    const currentLobby = await db.getCurrentLobby(playerId);
    if (currentLobby) {
		// maybe call from http endpoint?
		if (socket) {
			socket.in(currentLobby._id).emit("lobbyLeft", socket.id);
			socket.leave(currentLobby._id);
		}
		// we're the last player
		if (currentLobby.players.length === 1) {
			await deleteLobby(currentLobby._id);
		} else {
			await leaveLobby(currentLobby._id, playerId);
		}
	}

    return null;
}

export const joinLobby = async (player: IPlayer, lobbyId: string, socket: Socket): Promise<[newLobby: ILobby, oldLobby: ILobby]> => {
    const oldLobby = await disconnectPlayerIfInLobby(player._id, socket);
    return [await db.joinLobby(lobbyId, player), oldLobby];
}

export const leaveLobby = async (playerId: string, lobbyId: string) => {
    return await db.leaveLobby(lobbyId, playerId);
}

export const createLobby = async (player: IPlayer, socket: Socket) => {
    await disconnectPlayerIfInLobby(player._id, socket);
    return await db.createLobby(player);
}

export const getLobby = async (playerId: string) => {
    return await db.getCurrentLobby(playerId);
} 

export const deleteLobby = async (lobbyId: string) => {
    return await db.deleteLobby(lobbyId);
}