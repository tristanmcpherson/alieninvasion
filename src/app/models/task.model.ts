import { Schema, model, Model } from 'mongoose';

export interface ITask {
  id: string,
  lobbyId: string,
  name: string,
  description: string,
  completed: boolean,
  updatedAt?: Date
}
export const TaskModel = model<ITask, Model<ITask>>(
  "task",
  new Schema<ITask>(
    {
      id: { type: String },
      lobbyId: { type: String, index: true },
      name: { type: String },
      description: { type: String, required: true },
      completed: { type: Boolean, default: false },
	  // should delete after an hour of no updates
	  updatedAt: { type: Date, expires: 3600 }
    },
    { timestamps: true }
  )
);