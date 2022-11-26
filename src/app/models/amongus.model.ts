import { Schema, model } from 'mongoose';

export interface IAmongus {
  _id: string,
  name: string,
  description: string,
  completed: boolean
}

export interface SharedEvents {
  assemble: () => void;
  statusUpdate: (amongus: IAmongus) => void;
  ping: () => void;
}

export const Amongus = model<IAmongus>(
      "amongus",
      new Schema<IAmongus>(
        {
          _id: { type: String },
          name: { type: String },
          description: { type: String, required: true },
          completed: { type: Boolean, default: false } 
        },
        { timestamps: true, _id: false }
      )
    );

export default Amongus;