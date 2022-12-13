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

export interface SharedEvents {
	assemble: () => void;
	updateTaskStatus: (task: ITask) => void;
	ping: () => void;
}

export interface ClientEvents extends SharedEvents {
	joinLobby: (lobbyId: string, name: string) => void;
	createLobby: (name: String) => void;
}

export interface ServerEvents extends SharedEvents {
	lobbyJoined: (lobby: ILobby, player: IPlayer) => void;
	lobbyLeft: (playerId: string) => void;
	startGame: (tasks: ITask[]) => void;
	characterSelected: (player: IPlayer) => void;
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

			console.log(io.sockets.adapter.rooms);
			console.log(io.sockets.adapter.rooms.get(lobby._id));

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

			io.in(lobby._id).emit("updateTaskStatus", updatedMessage);
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

		socket.on("createLobby", async (name: string) => {
			const player = { _id: socket.id, name, character: null };
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
	});
};