import LobbyModel from "../models/lobby.model.js"
import { IPlayer } from "../models/player.model.js";
import { Faction } from "../socketio/handler.js";

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUWXYZ';
const CODE_LENGTH = 6;

const generateCode = () => {
	let code = "";
	for (let i = 0; i < CODE_LENGTH; i++) {
		const random = Math.floor(Math.random() * CHARSET.length);
		code += CHARSET[random];
	}
	return code;
};

export const generateLobbyCode = async () => {
	let tries = 0;
	let code: string = null;
	do {
		if (++tries > 10) {
			return null;
		}

		code = generateCode();
	} while (await LobbyModel.count({ _id: code }) > 0);
	if (tries > 1) {
		console.warn(`Code generation attempt: ${tries}`);
	}
	return code;
};

export const createLobby = async (player: IPlayer) => {
	// if player is in another lobby, disconnect them (call back to the websocket?)
	try {
		const newLobby = new LobbyModel({
			_id: await generateLobbyCode(),
			players: [player]
		});

		return await newLobby.save();
	} catch (err) {
		console.log(err);
		return null;
	}
};

export const joinLobby = async (_id: string, player: IPlayer) => {
	console.log("joining lobby");

	return await LobbyModel.findByIdAndUpdate({ _id, players: { $exists: true } }, { $push: { players: player } }, { new: true });
};

export const getCurrentLobby = async (playerId: string) => {
	return await LobbyModel.findOne({ "players._id": playerId });
};

export const playerInLobby = async (_id: string, playerId: string) => {
	return await LobbyModel.count({ _id, "players._id": playerId }).exec() > 0;
};

export const leaveLobby = async (_id: string, playerId: string) => {
	console.log("leaving lobby");

	return await LobbyModel.updateOne({ _id, players: { $exists: true } }, { $pull: { players: { _id: playerId } } }).exec();
};

export const deleteLobby = async (lobbyId: string) => {
	return await LobbyModel.deleteOne({ _id: lobbyId });
};

export const updatePlayer = async (lobbyId: string, playerId: string, characterId: string) => {
	return await LobbyModel.updateOne({ _id: lobbyId, "players._id": playerId }, { $set: { "players.$.character": characterId }});
};

export const updatePlayerId = async (lobbyId: string, playerId: string, newPlayerId: string) => {
	 return await LobbyModel.findOneAndUpdate({ _id: lobbyId, "players._id": playerId }, { $set: { "players.$._id": newPlayerId }}, { new: true });
};

export const updatePlayerFaction = async (lobbyId: string, playerId: string, faction: Faction) => {
	return await LobbyModel.updateOne({ _id: lobbyId, "players._id": playerId }, { $set: { "players.$.faction": faction }});
};
