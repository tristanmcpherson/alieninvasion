import { Schema, model } from 'mongoose';
import { IPlayer, playerSchema } from './player.model.js';

export interface ILobby {
    // id of room to be used with socketio
    _id: string
    players: Array<IPlayer>,
    updatedAt: Date
}

const schema = new Schema<ILobby>(
    {
        _id: { type: String },
        players: [{ type: playerSchema }],
		updatedAt: { type: Date, expires: 3600 }
    },
    { timestamps: true, writeConcern: { w: "majority" } }
);
schema.index({ "_id": 1, "players.name": 1 }, { unique: true });
export const TaskModel = model<ILobby>("lobby", schema);
export default TaskModel;