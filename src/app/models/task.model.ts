import { Schema, model, Model } from 'mongoose';

export interface ITask {
  id: string,
  lobbyId: string,
  name: string,
  description: string,
  completed: boolean
}
export const TaskModel = model<ITask, Model<ITask>>(
  "task",
  new Schema<ITask>(
    {
      id: { type: String },
      lobbyId: { type: String, index: true },
      name: { type: String },
      description: { type: String, required: true },
      completed: { type: Boolean, default: false }
    },
    { timestamps: true }
  )
);