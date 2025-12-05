import {RawDriverData} from "./RawGameData";
import GameData from "./GameData";
import Utils from "../../../../../common/Utils";
import TeamData from "./TeamData";

export default class DriverData {
    private readonly gameData: GameData;
    private readonly data: RawDriverData;
    private readonly team: TeamData | null;

    private icon?: HTMLImageElement;
    private flag?: HTMLImageElement;

    constructor(gameData: GameData, raw: RawDriverData) {
        this.gameData = gameData;
        this.data = raw;

        if (raw.teamId == null) {
            // Reserve team
            this.team = null;
        } else {
            let found = gameData.getTeam(raw.teamId);
            if (found == null) throw new Error(`Driver ${JSON.stringify(raw.id)} has missing team: ${JSON.stringify(raw.teamId)}`);
            this.team = found;
        }
    }

    async init() {
        this.icon = await Utils.loadImage(this.data.iconUrl);
        this.flag = await this.gameData.cacheCountryFlag(this.data.country);
    }

    getTeam() {
        return this.team;
    }

    getName() {
        return this.data.name;
    }

    getId() {
        return this.data.id;
    }

    getFlagIcon() {
        return this.flag!;
    }

    getIcon() {
        return this.icon!;
    }

    public getPlacementPoints(afterRace?: number) {
        return this.gameData.sumPlacementPointsForDriver(this.getId(), afterRace);
    }

    getCountry() {
        return this.data.country;
    }
}