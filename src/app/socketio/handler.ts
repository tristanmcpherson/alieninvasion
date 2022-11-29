import { Server, Socket } from "socket.io";
import { ITask, TaskModel } from "../models/task.model.js";
import { CorsOptions } from "cors";
import https from "https";
import { createLobby, deleteLobby, getLobby, joinLobby } from "../controllers/lobby.controller.js";
import { ILobby } from "../models/lobby.model.js";
import * as db from "../db/task.db.js";
import { getMasterTasks } from "../controllers/masterTask.controller.js";
import { getTasks } from "../controllers/task.controller.js";

export interface SharedEvents {
    assemble: () => void;
    updateTaskStatus: (task: ITask) => void;
    ping: () => void;
}

export interface ClientEvents extends SharedEvents {
    joinLobby: (lobbyId: string) => void;
    createLobby: () => void;
}

export interface ServerEvents extends SharedEvents {
    lobbyJoined: (lobby: ILobby, tasks: ITask[]) => void;
}

export const setupSocketIO = (server: https.Server, corsOptions: CorsOptions) => {
    const io = new Server<ClientEvents, ServerEvents, {}, {}>(server, {
        cors: corsOptions,
        allowUpgrades: true
    });

    io.on("connection", (socket) => {
        console.log("Incoming WS connection: " + socket.handshake.address + ":" + socket.id);

        socket.on("disconnect", async () => {
            // TODO: set ttl after all disconnect, then gracefully
            // const lobby = await getLobby(socket.id);
            // if (lobby) {
            //     socket.leave(lobby._id);
            // }

            // // we're the last player
            // if (lobby && lobby.players.length === 1) {
            //     await deleteLobby(lobby._id);
            // }
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

        // socket.on("ping", () => {
        //     socket.emit("ping");
        // });

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

        socket.on("joinLobby", async (lobbyId) => {
            // implement polling to wait for ready status on lobby
            // ready status not set until tasks inserted
            const lobby = await joinLobby(socket.id, lobbyId);
            const tasks = await getTasks(lobbyId);
            socket.join(lobbyId);
            io.in(lobby._id).emit("lobbyJoined", lobby, tasks);
        });

        socket.on("createLobby", async () => {
            const newLobby = await createLobby(socket.id);
            const masterTasks = await getMasterTasks();

            const tasks = masterTasks.map(
                mt => {
                    return {
                        id: mt._id,
                        name: mt.name,
                        // todo: override from user preset
                        description: mt.description,
                        lobbyId: newLobby._id,
                        completed: false
                    } as ITask;
                });
            
            await TaskModel.insertMany(tasks);

            socket.join(newLobby._id);
            socket.emit("lobbyJoined", newLobby, tasks);
        });
    });
};