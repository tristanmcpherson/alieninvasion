import { Server, Socket } from "socket.io";
import { upsertByNameDb } from "../controllers/task.controller.js";
import { ITask } from "../models/task.model.js";
import { CorsOptions } from "cors";
import https from "https";
import { createLobby, getLobby, joinLobby } from "../controllers/lobby.controller.js";
import { ILobby } from "../models/lobby.model.js";

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
    lobbyJoined: (lobby: ILobby) => void;
}

export const setupSocketIO = (server: https.Server, corsOptions: CorsOptions) => {
    const io = new Server<ClientEvents, ServerEvents, {}, {}>(server, {
        cors: corsOptions
    });

    io.on("connection", (socket) => {
        console.log("Incoming WS connection: " + socket.id);

        socket.on("assemble", async () => {
            console.log("Assemble receieved");
            const lobby = await getLobby(socket.id)
            io.to(lobby._id).emit("assemble");
        });

        socket.on("ping", () => {
            socket.emit("ping");
        });

        socket.on("updateTaskStatus", async (task) => {
            //console.log("Status update: " + JSON.stringify(data));
            const updated = await upsertByNameDb(task._id, task);

            const updatedMessage: ITask = {
                _id: updated._id,
                roomId: task.roomId,
                description: updated.description,
                name: updated.name,
                completed: updated.completed
            };

            io.to(task.roomId).emit("updateTaskStatus", updatedMessage);
            console.log("Sent update to " + updated.completed);
        });

        socket.on("error", err => console.log("WS Error: " + err));

        socket.on("joinLobby", async (lobbyId) => {
            const lobby = await joinLobby(socket.id, lobbyId);
            socket.emit("lobbyJoined", lobby);
        });

        socket.on("createLobby", async () => {
            const newLobby = await createLobby(socket.id);
            socket.emit("lobbyJoined", newLobby);
        });
    });
};