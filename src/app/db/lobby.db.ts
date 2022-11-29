import LobbyModel from "../models/lobby.model.js"

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUWXYZ';
const CODE_LENGTH = 6;

const generateCode = () => {
    let code = "";
    for (let i = 0; i < CODE_LENGTH; i++) {
        const random = Math.floor(Math.random() * CHARSET.length);
        code += CHARSET[random];
    }
    return code;
};

export const generateLobbyCode = async () => {
    let tries = 0;
    let code: string = null;
    do {
        if (++tries > 10) {
            return null;
        }

        code = generateCode();
    } while (await LobbyModel.count({ _id: code }) > 0);
    if (tries > 1) {
        console.warn(`Code generation attempt: ${tries}`);
    }
    return code;
};

export const createLobby = async (playerId: string) => {
    // if player is in another lobby, disconnect them (call back to the websocket?)
    try {
        const newLobby = new LobbyModel({
            _id: await generateLobbyCode(),
            players: [playerId]
        });

        return await newLobby.save();
    } catch (err) {
        console.log(err);
        return null;
    }
};

export const joinLobby = async (_id: string, playerId: string) => {
    return await LobbyModel.findByIdAndUpdate(_id, { $push: { players: playerId, new: true }});
};

export const getCurrentLobby = async (playerId: string) => {
    return await LobbyModel.findOne({ players: { $in: playerId } });
};

export const playerInLobby = async (_id: string, playerId: string) => {
    return await LobbyModel.count({ _id, players: { $in: playerId } }) > 0;
};

export const leaveLobby = async (_id: string, playerId: string) => {
    return await LobbyModel.updateOne({ _id }, { $pull: { players: playerId } });
};

export const deleteLobby = async (lobbyId: string) => {
    return await LobbyModel.deleteOne({ _id: lobbyId });
}
