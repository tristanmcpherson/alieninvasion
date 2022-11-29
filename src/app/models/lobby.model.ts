import { Schema, model } from 'mongoose';

export interface ILobby {
    // id of room to be used with socketio
    _id: string
    players: Array<string>
}

const schema = new Schema<ILobby>(
    {
        _id: { type: String },
        players: [{ type: String }]
    },
    { timestamps: true, writeConcern: { w: "majority" } }
);
export const TaskModel = model<ILobby>("lobby", schema);
export default TaskModel;