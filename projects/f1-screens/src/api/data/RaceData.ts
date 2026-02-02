import {RawRaceData, RawRaceResultsData} from "./RawGameData";
import GameData from "./GameData";
import DriverData from "./DriverData";
import TeamData from "./TeamData";
import Utils from "../../../../../common/Utils";

export default class RaceData {
    private readonly gameData: GameData;
    private readonly index: number;
    private readonly data: RawRaceData;
    private readonly date: Date;
    private flag?: HTMLImageElement;
    private readonly driverMap: Map<DriverData, RaceDriverData> | null;

    constructor(gameData: GameData, index: number, raw: RawRaceData) {
        this.gameData = gameData;
        this.index = index;
        this.date = new Date(raw.date);
        this.data = raw;
        if (raw.results == null) {
            this.driverMap = null;
            return;
        }

        this.driverMap = new Map();

        let finishCounts = raw.results.driverData.filter(d=>d.timeType == "finish").length;
        if (finishCounts == 0) {
            throw new Error(`Driver results for race ${index+1} do not contain any first place finish times (timeType "finish")`);
        }
        if (finishCounts > 1) {
            throw new Error(`Driver results for race ${index+1} contain multiple first place finish times (timeType "finish")`);
        }

        let firstPlaceFinishTime = raw.results.driverData.find(d=>d.timeType == "finish")!.time!;

        let sorted = raw.results.driverData.sort((a, b)=>{
            // Priority
            let priorityA = Priority[a.timeType];
            let priorityB = Priority[b.timeType];
            if (priorityA !== priorityB) return priorityA - priorityB;

            if (a.time == null && b.time == null) return 0;
            if (a.time == null && b.time != null) return 1;
            if (a.time != null && b.time == null) return -1;

            // Calculate absolute time
            let timeA = a.time!;
            if (a.timeType == "from_leader") timeA += firstPlaceFinishTime;

            let timeB = b.time!;
            if (b.timeType == "from_leader") timeB += firstPlaceFinishTime;

            return timeA - timeB;
        });

        let overallBestLapTime = Number.MAX_SAFE_INTEGER;
        for (let driverData of sorted) {
            if (driverData.bestLapTime != null && driverData.bestLapTime < overallBestLapTime) overallBestLapTime = driverData.bestLapTime;
        }

        for (let i = 0; i < sorted.length; i++){
            let driverData = sorted[i];
            let driver = this.gameData.getDriver(driverData.playerId);
            if (driver == null) throw new Error(`Race ${JSON.stringify(this.data.map)} has missing driver: ${JSON.stringify(driverData.playerId)}`);

            let pos = i+1;
            if (this.driverMap.has(driver)) throw new Error(`Race ${JSON.stringify(this.data.map)} has duplicate driver: ${JSON.stringify(driverData.playerId)}`);

            let team = gameData.getTeam(driverData.teamId);
            if (team == null) throw new Error(`Race ${JSON.stringify(this.data.map)}'s driver ${JSON.stringify(driverData.playerId)} has missing team: ${JSON.stringify(driverData.teamId)}`);
            
            let points = gameData.getPointForPosition(pos);

            let noPointsCategories = [
                "did_not_start",
                "disqualified",
                "did_not_finish_no_points"
            ];
            if (noPointsCategories.includes(driverData.timeType)) {
                points = 0;
            }
            this.driverMap.set(driver!, {
                driver: driver,
                team: team,

                startingPosition: driverData.startingPosition,
                finishingPosition: pos,
                points: points,

                numberOfPitStops: driverData.numberOfPitStops,
                bestLapTime: driverData.bestLapTime,
                isBestLapTimeOverall: driverData.bestLapTime === overallBestLapTime,

                time: driverData.time,
                timeType: driverData.timeType,
                penaltyTime: driverData.penaltyTime
            });
        }
    }

    async init() {
        this.flag = await this.gameData.cacheCountryFlag(this.data.mapFlag);
    }


    getRaceIndex() {
        return this.index;
    }

    getMap() {
        return this.data.map;
    }
    getLapCount() {
        return this.data.lapCount;
    }
    getDate() {
        return this.date;
    }
    getFlag() {
        return this.flag!;
    }
    getCountry() {
        return this.data.mapFlag;
    }

    getDriverData(driver: DriverData) {
        if (this.driverMap == null) return undefined;
        return this.driverMap.get(driver);
    }

    getMapFlag() {
        return this.data.mapFlag;
    }

    getAllDriverData() {
        if (this.driverMap == null) return [];
        return [...this.driverMap.values()].sort((a,b)=>a.finishingPosition-b.finishingPosition);
    }

    hasResults() {
        return this.data.results != null;
    }
}
export interface RaceDriverData {
    driver: DriverData,
    team: TeamData,

    startingPosition: number | null,
    finishingPosition: number
    points: number,

    numberOfPitStops: number | null,
    bestLapTime: number | null,
    isBestLapTimeOverall: boolean,

    time: number | null,
    timeType: "finish" | "from_leader" | "lapped" | "none" | "did_not_finish" | "did_not_finish_no_points" | "did_not_start" | "disqualified",
    penaltyTime: number | null,
}
const Priority = {
    "finish": 1,
    "from_leader": 1,
    "lapped": 3,
    "none": 4,
    "did_not_finish": 5,
    "did_not_finish_no_points": 6,
    "did_not_start": 7,
    "disqualified": 8,
} satisfies Record<RaceDriverData["timeType"], number>