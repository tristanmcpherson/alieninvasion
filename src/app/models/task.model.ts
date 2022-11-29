import { Schema, model, Model } from 'mongoose';

export interface ITask {
  _id: string,
  roomId: string,
  name: string,
  description: string,
  completed: boolean
}

export const Task = model<ITask, Model<ITask>>(
  "task",
  new Schema<ITask>(
    {
      _id: { type: String },
      roomId: { type: String, index: true },
      name: { type: String },
      description: { type: String, required: true },
      completed: { type: Boolean, default: false }
    },
    { timestamps: true, _id: false }
  )
);
export default Task;