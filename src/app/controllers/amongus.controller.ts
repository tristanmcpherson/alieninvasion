import { Response, Request } from "express";
import { Amongus, IAmongus } from "../models/amongus.model.js";

export async function findAll(req: Request, res: Response) {
  try {
    const data = await Amongus.find()
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message:
        err.message || "Some error occurred while retrieving tutorials."
    });
  }
}

export async function upsertByName(req: Request, res: Response) {
  // Validate request
  if (!req.params.name) {
    res.status(400).send({ message: "Name can not be empty!" });
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

export async function upsertByNameDb(_id: string, body: IAmongus) {
  let existing: IAmongus = null;
  if (await Amongus.exists({ _id: _id })) {

    existing = await Amongus.findOne({ _id: _id });
  }

  const amongus = new Amongus({
    _id: _id,
    name: existing?.name ?? body.name,
    description: existing?.description ?? body.description,
    completed: body.completed ? body.completed : false
  });

  if (existing) {
    amongus.isNew = false;
  }

  return await amongus.save();
}

export async function insertMany(req, res) {
  const items: IAmongus[] = req.body
  try {
    const result = await Amongus.insertMany(items);
    res.send(result);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error mass inserting"
    })
  }
}