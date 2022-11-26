import e from "express";
import bodyparser from "body-parser";
import cors, { CorsOptions } from "cors";
import * as fs from "fs";
import { Server } from 'socket.io';

import * as https from "node:https";
import { connect } from "mongoose";
import { setupRoutes } from "./app/routes/amongus.routes.js";
import { url } from "./app/config/db.config.js";
import { upsertByNameDb } from "./app/controllers/amongus.controller.js";
import { IAmongus, SharedEvents } from "./app/models/amongus.model.js";

const app = e();

const key = fs.readFileSync('tristan-laptop.local.key');
const cert = fs.readFileSync('tristan-laptop.local.crt');

const corsOptions: CorsOptions = {
  origin: ["https://tristan-laptop.local", "https://127.0.0.1"]
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(bodyparser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyparser.urlencoded({ extended: true }));


try {
  await connect(url, {connectTimeoutMS: 5000, serverSelectionTimeoutMS: 5000});
  console.log("Connected to db");
} catch (err) {
  console.log(err);
  console.log("No DB!");
  process.exit();
}

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to application." });
});

const port = Number(process.env.PORT) || 8080;
//const host = "10.0.0.22";
const host = "0.0.0.0";

const server = https.createServer({ key, cert }, app);

const io = new Server<SharedEvents, SharedEvents, {}, {}>(server, {
  allowUpgrades: true,
  cors: corsOptions
});
setupRoutes(app);

io.on("connection", (socket) => {
  console.log("Incoming WS connection: " + socket.id);

  socket.on("assemble", () => {
    console.log("Assemble receieved");
    io.emit("assemble");
  });

  socket.on("ping", () => {
    socket.emit("ping");
  });

  socket.on("statusUpdate", async (amongus) => {
      //console.log("Status update: " + JSON.stringify(data));
      const updated = await upsertByNameDb(amongus._id, amongus);
      
      const updatedMessage: IAmongus = {
        _id: updated._id,
        description: updated.description,
        name: updated.name,
        completed: updated.completed
      };
      io.emit("statusUpdate", updatedMessage);
      console.log("Sent update to " + updated.completed);
  });

  socket.on("error", err => console.log("WS Error: " + err))
});

server.listen(port, host, () => {
  console.log(`Server is running on port ${host}:${port}`);
});
