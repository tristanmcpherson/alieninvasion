import { Server, Socket } from "socket.io";
import { ITask, TaskModel } from "../models/task.model.js";
import { CorsOptions } from "cors";
import https from "https";
import { createLobby, getLobby, joinLobby, disconnectPlayerIfInLobby } from "../controllers/lobby.controller.js";
import { ILobby } from "../models/lobby.model.js";
import * as db from "../db/task.db.js";
import { getMasterTasks } from "../controllers/masterTask.controller.js";
import { getTasks } from "../controllers/task.controller.js";
import { IPlayer } from '../models/player.model.js';
import { updatePlayerCharacter, updatePlayerId } from '../controllers/lobby.controller.js';

export interface SharedEvents {
	assemble: () => void;
	updateTaskStatus: (task: ITask) => void;
	ping: () => void;
}

export interface ClientEvents extends SharedEvents {
	joinLobby: (lobbyId: string, name: string) => void;
	rejoinLobby: (lobbyId: string, oldPlayerId: string) => void;
	createLobby: (name: String) => void;
	characterSelected: (characterId: string) => void;
	startGame: () => void;
}

export interface ServerEvents extends SharedEvents {
	lobbyJoined: (lobby: ILobby, player: IPlayer) => void;
	lobbyLeft: (playerId: string) => void;
	startGame: (tasks: ITask[]) => void;
	characterSelected: (playerId: string, characterId: string) => void;
}

export const setupSocketIO = (server: https.Server, corsOptions: CorsOptions) => {
	const io = new Server<ClientEvents, ServerEvents, {}, {}>(server, {
		path: "/gameWs",
		cors: corsOptions,
		allowUpgrades: true,
	});

	io.on("connection", async (socket) => {
		const ip = socket.handshake.address;
		try {
			if (ip === "127.0.0.1") {
				console.log(`Local connection at ${socket.id}`);
			} else {
				const data = await fetch(new URL(`https://demo.ip-api.com/json/${ip}?fields=16920&lang=en`));
				const json = await data.json();
				if (json.status === "success") {
					console.log(`Incoming WS connection: ${ip}:${socket.id} at ${json.city}, ${json.regionName} ISP: ${json.isp}`);
				} else {
					console.log(`Incoming WS connection: ${ip}:${socket.id}`);
				}
			}
		} catch (error) {
			console.log(`Incoming WS connection: ${ip}:${socket.id}`);
		}

		socket.on("rejoinLobby", async (lobbyId, lastPlayerId) => {
			// ... this may be costly?
			// I guess just update the one with old id to new id?
			console.log(`Processing rejoin for ${lastPlayerId} to ${socket.id}`);
			
			const lobby = await updatePlayerId(lobbyId, lastPlayerId, socket.id);

			if (!lobby) {
				console.error("Could not process rejoin! Kicking from lobby");
				socket.emit("lobbyLeft", socket.id);
			}

			// find better way to replace player in lobby,
			// probably updatePlayer and divorce frontend id from playerid (?) so that the update is seamless in React 
			io.to(lobby._id).emit("lobbyLeft", lastPlayerId);
			io.to(lobby._id).emit("lobbyJoined", lobby, lobby.players.find(p => p._id === socket.id));
		});


		socket.on("disconnect", async () => {
			// TODO: set ttl after all disconnect, then gracefully
			await disconnectPlayerIfInLobby(socket.id, socket);
		});

		socket.on("assemble", async () => {
			console.log("Assemble receieved");
			const lobby = await getLobby(socket.id);

			if (!lobby) {
				console.warn(`Assemble received but no lobby`)
				return;
			}

			io.to(lobby._id).emit("assemble");
		});

		socket.on("updateTaskStatus", async (task) => {
			//console.log("Status update: " + JSON.stringify(data));
			const lobby = await getLobby(socket.id);
			if (!lobby) {
				console.info("can't change task if not in a lobby");
				return;
			}

			const updated = await db.upsertByName(task.id, lobby._id, task);

			const updatedMessage: ITask = {
				id: updated.id,
				lobbyId: updated.lobbyId,
				description: updated.description,
				name: updated.name,
				completed: updated.completed
			};

			io.to(lobby._id).emit("updateTaskStatus", updatedMessage);
			console.log("Sent update to " + updated.completed);
		});

		socket.on("error", err => console.log("WS Error: " + err));

		socket.on("joinLobby", async (lobbyId, name) => {

			// implement polling to wait for ready status on lobby
			// ready status not set until tasks inserted
			const [lobby] = await joinLobby({ _id: socket.id, name, character: null }, lobbyId, socket);
			if (!lobby) {
				return;
			}

			socket.join(lobbyId);
			io.in(lobby._id).emit("lobbyJoined", lobby, { _id: socket.id, name: name, character: null });
		});

		socket.on("characterSelected", async (characterId) => {
			const lobby = await getLobby(socket.id) as ILobby;
			if (!lobby) {
				console.warn("Socket is not in a lobby");
				// tell client they are in a bad lobby
				socket.emit("lobbyLeft", socket.id);
				return;
			}
			await updatePlayerCharacter(lobby._id, socket.id, characterId);
			io.in(lobby._id).emit("characterSelected", socket.id, characterId);
		});

		socket.on("createLobby", async (name: string) => {
			const player: IPlayer = { _id: socket.id, name, character: null };
			const newLobby = await createLobby(player, socket);
			const masterTasks = await getMasterTasks();

			const tasks = masterTasks.map(
				masterTask => {
					return {
						id: masterTask._id,
						name: masterTask.name,
						// todo: override from user preset
						description: masterTask.description,
						lobbyId: newLobby._id,
						completed: false
					} as ITask;
				});

			await TaskModel.insertMany(tasks);

			socket.join(newLobby._id);
			socket.emit("lobbyJoined", newLobby, { _id: socket.id, name, character: null });
		});

		socket.on("startGame", async () => {
			const lobby = await getLobby(socket.id);
			if (!lobby) {
				return;
			};

			if (!lobby.players.every(player => player.character !== null)) {
				return;
			}

			const tasks = await getTasks(lobby._id);

			// add concept of a leader and ready up for other players?

			io.to(lobby._id).emit("startGame", tasks);
		});
	});
};