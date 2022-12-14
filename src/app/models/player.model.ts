import { model, Schema, Types } from 'mongoose';
import { Faction } from '../socketio/handler.js';

export interface IPlayer {
    _id: string,
    name: string,
    character: string|null,
    faction: Faction|null
}
export const playerSchema = new Schema<IPlayer>({
    _id: { type: String },
    name: { type: String },
    character: { type: String },
    faction: { type: String },
});
// export const PlayerModel = model<IPlayer>("player", playerSchema);
// export default PlayerModel;