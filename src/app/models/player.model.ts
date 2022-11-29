import { model, Schema, Types } from 'mongoose';

export interface IPlayer {
    _id: string,
    character: string
}
const playerSchema = new Schema<IPlayer>({
    _id: { type: String },
    character: { type: String }
});
export const PlayerModel = model<IPlayer>("player", playerSchema);
export default PlayerModel;