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
    private reserveIcon?: HTMLImageElement;

    private readonly teamPlacementsCache: Map<number,PlacementPoints<TeamData>[]>;
    private readonly driverPlacementsCache: Map<number,PlacementPoints<DriverData>[]>;

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

        this.teamPlacementsCache = new Map();
        this.driverPlacementsCache = new Map();
    }

    async init() {
        let promises: Promise<void>[] = [];
        promises.push((async ()=>{
            this.reserveIcon = await Utils.loadImage(this.data.reserveIconUrl);
        })());
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

        this.calculatePlacements();
    }

    async cacheCountryFlag(countryCode: string) {
        if (this.countryImageCache.has(countryCode)) return this.countryImageCache.get(countryCode)!;

        let img = await Utils.loadImage(`https://raw.githubusercontent.com/kent1D/svg-flags/master/flags/${countryCode.toLowerCase()}.svg`);
        this.countryImageCache.set(countryCode, img);
        return img;
    }

    private sortCopyPoints<T extends TeamData | DriverData>(array: PlacementPoints<T>[]): PlacementPoints<T>[] {
        let copy = array.map(e=>{
            return {
                owner: e.owner,
                points: e.points,
                firsts: e.firsts,
                seconds: e.seconds,
                thirds: e.thirds
            }
        });
        copy.sort((a,b)=>{
            let result = b.points - a.points;
            if (result != 0) return result;

            return a.owner.getName().localeCompare(b.owner.getName());
        });
        return copy;
    }
    private calculatePlacements() {
        // Populate caches
        let teams: PlacementPoints<TeamData>[] = [...this.teams.values()].map(t=>{
            return {
                owner: t,

                points: 0,
                firsts: 0,
                seconds: 0,
                thirds: 0
            }
        });
        let drivers: PlacementPoints<DriverData>[] = [...this.drivers.values()].map(d=>{
            return {
                owner: d,

                points: 0,
                firsts: 0,
                seconds: 0,
                thirds: 0
            }
        });

        this.teamPlacementsCache.set(-1, this.sortCopyPoints(teams));
        this.driverPlacementsCache.set(-1, this.sortCopyPoints(drivers));

        // Actually calculate
        for (let raceIndex = 0; raceIndex < this.raceData.length; raceIndex++){
            let race = this.raceData[raceIndex];
            for (let data of race.getAllDriverData()) {
                let teamPlacements = teams.find(e=>e.owner==data.team)!;
                let driverPlacements = drivers.find(e=>e.owner==data.driver)!;

                let points = data.points;
                let first  = data.finishingPosition == 1 ? 1 : 0;
                let second = data.finishingPosition == 2 ? 1 : 0;
                let third  = data.finishingPosition == 3 ? 1 : 0;

                teamPlacements.points += points;
                driverPlacements.points += points;

                teamPlacements.firsts += first;
                teamPlacements.seconds += second;
                teamPlacements.thirds += third;

                driverPlacements.firsts += first;
                driverPlacements.seconds += second;
                driverPlacements.thirds += third;
            }
            this.teamPlacementsCache.set(raceIndex, this.sortCopyPoints(teams));
            this.driverPlacementsCache.set(raceIndex, this.sortCopyPoints(drivers));
        }
    }

    getPlacementPointTeams(afterRace?: number) {
        if (afterRace == null) afterRace = this.raceData.length;
        else if (afterRace < 0) afterRace = -1;
        else afterRace = Math.min(afterRace, this.getActualRaceCount()-1);
        return this.teamPlacementsCache.get(afterRace)!;
    }
    getPlacementPointsForTeam(team: TeamData, afterRace?: number): PlacementPoints<TeamData> {
        return this.getPlacementPointTeams(afterRace).find(e=>e.owner==team)!
    }

    getPlacementPointDrivers(afterRace?: number) {
        if (afterRace == null) afterRace = this.raceData.length;
        else if (afterRace < 0) afterRace = -1;
        else afterRace = Math.min(afterRace, this.getActualRaceCount()-1);
        return this.driverPlacementsCache.get(afterRace)!;
    }
    getPlacementPointsForDriver(driver: DriverData, afterRace?: number): PlacementPoints<DriverData> {
        return this.getPlacementPointDrivers(afterRace).find(e=>e.owner==driver)!;
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

    getAllTeams() {
        return [...this.teams.values()];
    }
    getAllDrivers() {
        return [...this.drivers.values()];
    }

    getReserveIcon() {
        return this.reserveIcon!;
    }
}
export interface PlacementPoints<T> {
    owner: T,
    points: number,
    firsts: number,
    seconds: number,
    thirds: number
}