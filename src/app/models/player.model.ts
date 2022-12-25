import { model, Schema, Types } from 'mongoose';

export interface IPlayer {
    _id: string,
    name: string,
    character: string|null
}
export const playerSchema = new Schema<IPlayer>({
    _id: { type: String },
    name: { type: String },
    character: { type: String }
});
// export const PlayerModel = model<IPlayer>("player", playerSchema);
// export default PlayerModel;