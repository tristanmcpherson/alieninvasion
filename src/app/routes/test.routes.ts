import { Router, Express } from 'express';
import { generateLobbyCode } from '../db/lobby.db.js';


export const setupTestRoutes = (app: Express) => {
    const router = Router();
    router.get("/api/code", async (req, res) => res.send(await generateLobbyCode()));

    app.use(router);
    return app;
};