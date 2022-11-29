import * as db from '../db/lobby.db.js';

const disconnectPlayerIfInLobby = async (playerId: string) => {
    const currentLobby = await db.getCurrentLobby(playerId);
    if (currentLobby) {
        console.log("Player already in lobby, disconnecting");
        await db.leaveLobby(currentLobby._id, playerId);
    }
}

export const joinLobby = async (playerId: string, lobbyId: string) => {
    await disconnectPlayerIfInLobby(playerId);
    return await db.joinLobby(lobbyId, playerId);
}

export const createLobby = async (playerId: string) => {
    await disconnectPlayerIfInLobby(playerId);
    return await db.createLobby(playerId);
}

export const getLobby = async (playerId: string) => {
    return await db.getCurrentLobby(playerId);
} 

export const deleteLobby = async (lobbyId: string) => {
    return await db.deleteLobby(lobbyId);
}