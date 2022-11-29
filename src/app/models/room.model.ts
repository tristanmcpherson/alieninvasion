import { Schema, model } from "mongoose";

export interface IRoom {
    // shorthand
    _id: string,
    // display name
    name: string,
    // display description
    enabled: boolean,
    description: string,
    completed: boolean
}
const roomSchema = new Schema<IRoom>({
    _id: { type: String },
    name: { type: String },
    enabled: { type: Boolean },
    description: { type: String },
    completed: { type: Boolean }
});
export const RoomModel = model<IRoom>("room", roomSchema);

// savable preset via url encoding
// savable to local storage as well
export interface IRoomPreset {
    rooms: Partial<IRoom>[]
}