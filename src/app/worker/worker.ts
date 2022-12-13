import { setupMongo } from '../../server.js';
import LobbyModel from "../models/lobby.model.js";




await setupMongo();



export const cleanupLobbies = async () => {
    const now = Date.now();
    const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
    const lobbiesToDelete = await LobbyModel.find({ players: [], lastModified: { $lte: fiveMinutesAgo} });
    if (lobbiesToDelete.length > 0) {
        console.log(lobbiesToDelete.map(a => JSON.stringify(a)));
    }
    const ack = await LobbyModel.deleteMany({ _id: { $in: lobbiesToDelete.map(lobby => lobby._id)} })
    if (ack.deletedCount > 0) {
        console.log(`Cleaned up ${ack.deletedCount}`);
    }
};

setInterval(async () => {
    await cleanupLobbies();
}, 5000);