import { MasterTask } from "../models/masterTask.model.js";

export const getTasks = async () => {
    return await MasterTask.find({ enabled: true });
};