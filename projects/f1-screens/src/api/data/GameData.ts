import Utils from "../../../../../common/Utils";
import DriverData from "./DriverData";
import RawGameData, {RawRaceResultsData} from "./RawGameData";
import TeamData from "./TeamData";
import RaceData from "./RaceData";

export default class GameData {
    private readonly data: RawGameData;
    private readonly drivers: Map<string, DriverData>;
    private readonly teams: Map<string, TeamData>;
    private readonly countryImageCache: Map<string, HTMLImageElement>;
    private readonly raceData: RaceData[];
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

        this.raceData = this.data.raceResults.map((raw,i)=>new RaceData(this, i, raw));

        this.countryImageCache = new Map();
    }

    async init() {
        let promises: Promise<void>[] = [];
        for (let driver of this.drivers.values()) {
            promises.push(driver.init());
        }
        for (let team of this.teams.values()) {
            promises.push(team.init());
        }
        for (let race of this.raceData) {
            promises.push(race.init());
        }
        await Promise.all(promises);
    }

    async cacheCountryFlag(countryCode: string) {
        if (this.countryImageCache.has(countryCode)) return this.countryImageCache.get(countryCode)!;

        let img = await Utils.loadImage(`https://raw.githubusercontent.com/kent1D/svg-flags/master/flags/${countryCode.toLowerCase()}.svg`);
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

        let count = afterRace ?? this.raceData.length;
        for (let i = 0; i < count; i++) {
            let raceResults = this.raceData[i];
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
    getRaceData(race?: number) {
        return this.raceData[race ?? this.raceData.length - 1];
    }
    getAllRaceData() {
        return this.raceData;
    }

    getPointForPosition(position: number) {
        return this.pointMap.get(position) ?? 0;
    }

    getActualRaceCount() {
        return this.raceData.filter(e=>e.hasResults()).length;
    }
    getPlannedRaceCount() {
        return this.raceData.length;
    }
}
export interface PlacementPoints {
    points: number,
    firsts: number,
    seconds: number,
    thirds: number
}