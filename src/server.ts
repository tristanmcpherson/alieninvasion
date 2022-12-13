
import e, { NextFunction } from "express";
import bodyparser from "body-parser";
import * as fs from "fs";
import * as https from "node:https";
import cors, { CorsOptions } from "cors";
import { config } from "dotenv";
import { connect } from "mongoose";
import { setupTaskRoutes } from "./app/routes/task.routes.js";
import { setupSocketIO } from './app/socketio/handler.js';
import { setupTestRoutes } from './app/routes/test.routes.js';

// ES6 dirname
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const root = __dirname;

// Load .env
config();

const app = e();

export const setupMongo = async () => {
  if (!process.env.CONNECTION_URL) {
    console.log("Missing connection url");
    process.exit();
  }
  const mongoUrl = process.env.CONNECTION_URL;
  
  try {
    await connect(mongoUrl, { connectTimeoutMS: 5000, serverSelectionTimeoutMS: 5000 });
    console.log("Connected to db");
  } catch (err) {
    console.log(err);
    console.log("No DB!");
    process.exit();
  }
};
await setupMongo();

// const runWorker = () => {
//   register();
//   const workerPath = path.resolve(__dirname, workerData.__fileName);
//   new Worker(workerPath);
// };
// runWorker();

const key = fs.readFileSync(process.env.KEY);
const cert = fs.readFileSync(process.env.CERT);
const origin = JSON.parse(process.env.ORIGIN) as string[];

const corsOptions: CorsOptions = {
  origin: origin
};

app.use(cors(corsOptions));
// parse requests of content-type - application/json
app.use(bodyparser.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyparser.urlencoded({ extended: true }));

app.use(e.static("public"));

setupTaskRoutes(app);
setupTestRoutes(app);

// Serve up static index for any other request to satisfy react-router
app.get('*', (_, res) => res.sendFile("./public/index.html", { root }));

const port = Number(process.env.PORT) || 8080;
const host = process.env.HOST || "0.0.0.0";

const server = https.createServer({ key, cert }, app);

setupSocketIO(server, corsOptions);



server.listen(port, host, () => {
  console.log(`Server is running on port ${host}:${port}`);
});
