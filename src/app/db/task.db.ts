import { ITask, TaskModel } from "../models/task.model.js";

export async function upsertByName(id: string, lobbyId: string, task: ITask) {
    let existing: ITask = null;

    if (await TaskModel.count({ id: id, lobbyId: lobbyId }) > 0) {
        existing = await TaskModel.findOne({ id: id, lobbyId });
    }

    const updatedTask: ITask = {
        id,
        lobbyId,
        name: existing?.name ?? task.name,
        description: existing?.description ?? task.description,
        completed: task.completed ? task.completed : false
    };

    return await TaskModel.findOneAndReplace({ id: id, lobbyId }, updatedTask, { new: true });
}

export async function getIncompleteTask(lobbyId: string) {
    return await TaskModel.findOne({ lobbyId: lobbyId, completed: false });
}