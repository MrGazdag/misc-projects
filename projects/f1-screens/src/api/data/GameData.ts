import Utils from "../../../../../common/Utils";
import DriverData from "./DriverData";
import RawGameData, {RawRaceResultsData} from "./RawGameData";
import TeamData from "./TeamData";
import RaceResultsData from "./RaceResultsData";

export default class GameData {
    private readonly data: RawGameData;
    private readonly drivers: Map<string, DriverData>;
    private readonly teams: Map<string, TeamData>;
    private readonly countryImageCache: Map<string, HTMLImageElement>;
    private readonly raceResults: RaceResultsData[];
    private readonly pointMap: Map<number,number>;

    constructor(raw: RawGameData) {
        this.data = raw;

        this.teams = new Map();
        for (let team of this.data.teamData) {
            if (this.teams.has(team.id)) throw new Error(`Duplicate team id: ${team.id}`);
            this.teams.set(team.id, new TeamData(this, team));
        }

        this.drivers = new Map();
        for (let driver of this.data.drivers) {
            if (this.drivers.has(driver.id)) throw new Error(`Duplicate driver id: ${driver.id}`);
            this.drivers.set(driver.id, new DriverData(this, driver));
        }

        this.pointMap = new Map();
        for (let pointMapKey in this.data.pointMap) {
            this.pointMap.set(parseInt(pointMapKey), this.data.pointMap[pointMapKey]);
        }

        this.raceResults = this.data.raceResults.map((raw,i)=>new RaceResultsData(this, i, raw));

        this.countryImageCache = new Map();
    }

    async init() {
        for (let driver of this.drivers.values()) {
            await driver.init();
        }
        for (let team of this.teams.values()) {
            await team.init();
        }
    }

    async cacheCountryFlag(countryCode: string) {
        if (this.countryImageCache.has(countryCode)) return this.countryImageCache.get(countryCode)!;

        let img = await Utils.loadImage(`https://raw.githubusercontent.com/kent1D/svg-flags/master/flags/${countryCode.toLowerCase()}.svg`);
        console.log(img, img.naturalWidth, img.naturalHeight);
        this.countryImageCache.set(countryCode, img);
        return img;
    }

    sumPlacementPointsForDriver(driverId: string, afterRace?: number): PlacementPoints {
        let result: PlacementPoints = {
            points: 0,

            firsts: 0,
            seconds: 0,
            thirds: 0,
        };

        let driver = this.getDriver(driverId);
        if (driver == null) return result;

        let count = afterRace ?? this.raceResults.length;
        for (let i = 0; i < count; i++) {
            let raceResults = this.raceResults[i];
            let driverData = raceResults.getDriverData(driver);
            if (driverData == null) continue;

            // Only count points when actually finished
            if (typeof driverData.time !== "number") continue;

            result.points += driverData.points;
            if (driverData.finishingPosition == 1) {
                result.firsts++;
            } else if (driverData.finishingPosition == 2) {
                result.seconds++;
            } else if (driverData.finishingPosition == 3) {
                result.thirds++;
            }
        }
        return result;
    }

    getName() {
        return this.data.name;
    }

    getDriver(driverId: string) {
        return this.drivers.get(driverId);
    }
    getTeam(teamId: string) {
        return this.teams.get(teamId);
    }
    getRaceResults(race?: number) {
        return this.raceResults[race ?? this.raceResults.length - 1];
    }

    getPointForPosition(position: number) {
        return this.pointMap.get(position) ?? 0;
    }

    getActualRaceCount() {
        return this.raceResults.length;
    }
    getPlannedRaceCount() {
        return this.data.plannedRaceCount;
    }
}
export interface PlacementPoints {
    points: number,
    firsts: number,
    seconds: number,
    thirds: number
}