import { Response, Request } from "express";
import { Task, ITask } from "../models/task.model.js";
import { playerInLobby } from "../db/lobby.db.js";

export async function findAll(req: Request, res: Response) {
  if (!req.params.roomId) {
    res.status(400).send({ message: "Room id can't be empty" });
    return;
  }

  if (!req.params.playerId) {
    res.status(400).send({ message: "Player id can't be empty" });
    return;
  }

  if (!await playerInLobby(req.params.roomId, req.params.playerId)) {
    res.status(400).send({ message: "You are not authorized to pull this lobby" });
    return;
  }

  try {
    const data = await Task.find({ roomId: req.params.roomId });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message:
        err.message || "Some error occurred while retrieving tutorials."
    });
  }
}

export async function upsertByName(req: Request, res: Response) {
  if (!req.params.name) {
    res.status(400).send({ message: "Name can't be empty!" });
    return;
  }

  try {
    const item = await upsertByNameDb(req.params.name, req.body);
    res.send(item);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while upserting."
    });
  }
}

export async function upsertByNameDb(_id: string, task: ITask) {
  let existing: ITask = null;
  if (await Task.count({ _id: _id }) > 0) {

    existing = await Task.findOne({ _id: _id, roomId: task.roomId });
  }

  const amongus = new Task({
    _id: _id,
    name: existing?.name ?? task.name,
    description: existing?.description ?? task.description,
    completed: task.completed ? task.completed : false
  });

  if (existing) {
    amongus.isNew = false;
  }

  return await amongus.save();
}

export async function insertMany(req, res) {
  const items: ITask[] = req.body
  try {
    const result = await Task.insertMany(items);
    res.send(result);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error mass inserting"
    })
  }
}