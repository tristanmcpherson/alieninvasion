import * as db from "../db/masterTask.db.js";

export const getMasterTasks = async () => {
    return await db.getTasks();
}