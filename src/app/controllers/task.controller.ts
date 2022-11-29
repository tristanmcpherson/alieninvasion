import { Response, Request } from "express";
import { TaskModel, ITask } from "../models/task.model.js";
import * as db from "../db/task.db.js";
import * as lobbyDb from "../db/lobby.db.js";

export const getTasks = async (lobbyId: string) => {
  return await TaskModel.find({ lobbyId: lobbyId });
};

export async function findAll(req: Request, res: Response) {
  const lobby = req.params.lobbyId;
  const playerId = req.params.playerId;

  if (!lobby) {
    res.status(400).send({ message: "Room id can't be empty" });
    return;
  }

  if (!playerId) {
    res.status(400).send({ message: "Player id can't be empty" });
    return;
  }

  const currLobby = await lobbyDb.getCurrentLobby(playerId);
  if (!currLobby) {
    res.status(400).send({ message: "You are not in a lobby"});
    return;
  }

  if (!await lobbyDb.playerInLobby(lobby, playerId)) {
    if (currLobby) {
      console.log(JSON.stringify(currLobby));
    }
    res.status(400).send({ message: "You are not authorized to pull this lobby" });
    return;
  }

  const data = await getTasks(lobby);

  if (data.length === 0) {
    res.status(404).send();
    return;
  }

  try {
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message:
        err.message || "Some error occurred while retrieving tutorials."
    });
  }
}

// export async function upsertByName(req: Request, res: Response) {
//   if (!req.params.name) {
//     res.status(400).send({ message: "Name can't be empty!" });
//     return;
//   }

//   try {
//     const item = await db.upsertByName(req.params.name, req.body);
//     res.send(item);
//   } catch (err) {
//     res.status(500).send({
//       message: err.message || "Some error occurred while upserting."
//     });
//   }
// }

export async function insertMany(req, res) {
  const items: ITask[] = req.body
  try {
    const result = await TaskModel.insertMany(items);
    res.send(result);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error mass inserting"
    })
  }
}