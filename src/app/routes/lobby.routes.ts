import { Router, Express } from "express";
import { findAll } from "../controllers/task.controller.js";
import { root } from "../../server.js";

const setupRoutes = (app: Express) => {
  setupTasks(app);

  // Serve up static index for any other request to satisfy react-router
  app.get('*', (_, res) => res.sendFile("./public/index.html", { root }));
};

const setupTasks = (app: Express) => {
  const router = Router();
  router.get("/", findAll);

  app.use('/api/task', router);
};

export { setupRoutes };