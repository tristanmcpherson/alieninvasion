import { Schema, model } from "mongoose";

export interface ICharacter {
    _id: string,
    name: string,
    description: string
}
const characterSchema = new Schema<ICharacter>({
    _id: { type: String },
    name: { type: String },
    description: { type: String }
});
export const CharacterModel = model<ICharacter>("character", characterSchema);