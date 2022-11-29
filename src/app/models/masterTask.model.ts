import { model, Model, Schema } from "mongoose";

export interface IMasterTask {
    _id: string,
    name: string,
    description: string,
    enabled: boolean
}

export const MasterTask = model<IMasterTask, Model<IMasterTask>>(
    "masterTask",
    new Schema<IMasterTask>(
        {
            _id: { type: String },
            name: { type: String },
            description: { type: String, required: true },
            enabled: { type: Boolean, required: true }
        },
        { _id: false }
    )
);