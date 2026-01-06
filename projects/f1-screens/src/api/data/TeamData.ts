import GameData from "./GameData";
import {RawTeamData} from "./RawGameData";
import Utils from "../../../../../common/Utils";

export default class TeamData {
    private readonly gameData: GameData;
    private readonly data: RawTeamData;

    private icon?: HTMLImageElement;

    constructor(gameData: GameData, data: RawTeamData) {
        this.gameData = gameData;
        this.data = data;
    }

    async init() {
        this.icon = await Utils.loadImage(this.data.iconUrl);
    }

    getName() {
        return this.data.name;
    }

    getId() {
        return this.data.id;
    }

    getIcon() {
        return this.icon!;
    }

    public getPlacementPoints(afterRace?: number) {
        return this.gameData.getPlacementPointsForTeam(this, afterRace);
    }
}