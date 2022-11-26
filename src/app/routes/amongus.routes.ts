import { Router, Express } from "express";
import { RawData } from "ws";
import { findAll, upsertByName, insertMany } from "../controllers/amongus.controller.js";
import { IAmongus } from "../models/amongus.model.js";

const setupRoutes = (app: Express) => {
    const router = Router();
    
    router.patch("/:name", upsertByName);
    // Retrieve all Tutorials
    router.get("/", findAll);
    router.post("/", insertMany);

    app.use('/api/amongus', router);
  };

export { setupRoutes };