import { Schema, model, Model } from 'mongoose';
import { IPlayer, playerSchema } from './player.model.js';

export interface ILobby {
    // id of room to be used with socketio
    _id: string
    players: Array<IPlayer>,
    updatedAt: Date
}

type LobbyModelType = Model<ILobby, {}, {}>

const schema = new Schema<ILobby, LobbyModelType, {}>(
    {
        _id: { type: String },
        players: [{ type: playerSchema }],
		updatedAt: { type: Date, expires: 3600 }
    }, 
    { timestamps: true }
);
schema.index({ "_id": 1, "players.name": 1 }, { unique: true });
export const LobbyModel = model<ILobby, LobbyModelType>("lobby", schema);
export default LobbyModel;