import { Router, Express } from "express";
import { findAll } from "../controllers/task.controller.js";

export const setupTaskRoutes = (app: Express) => {
  const router = Router();
  router.get("/", findAll);

  app.use('/api/task', router);
  return app;
};