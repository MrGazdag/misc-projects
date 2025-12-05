import {RawRaceResultsData} from "./RawGameData";
import GameData from "./GameData";
import DriverData from "./DriverData";
import TeamData from "./TeamData";

export default class RaceResultsData {
    private readonly gameData: GameData;
    private readonly index: number;
    private readonly data: RawRaceResultsData;
    private readonly driverMap: Map<DriverData, RaceDriverData>;

    constructor(gameData: GameData, index: number, raw: RawRaceResultsData) {
        this.gameData = gameData;
        this.index = index;
        this.data = raw;
        this.driverMap = new Map();

        let finishCounts = raw.driverData.filter(d=>d.timeType == "finish").length;
        if (finishCounts == 0) {
            throw new Error(`Driver results for race ${index+1} do not contain any first place finish times (timeType "finish")`);
        }
        if (finishCounts > 1) {
            throw new Error(`Driver results for race ${index+1} contain multiple first place finish times (timeType "finish")`);
        }

        let firstPlaceFinishTime = raw.driverData.find(d=>d.timeType == "finish")!.time!;

        let sorted = raw.driverData.sort((a, b)=>{
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
            this.driverMap.set(driver!, {
                driver: driver,
                team: team,

                startingPosition: driverData.startingPosition,
                finishingPosition: pos,
                points: gameData.getPointForPosition(pos),

                numberOfPitStops: driverData.numberOfPitStops,
                bestLapTime: driverData.bestLapTime,
                isBestLapTimeOverall: driverData.bestLapTime === overallBestLapTime,

                time: driverData.time,
                timeType: driverData.timeType,
                penaltyTime: driverData.penaltyTime
            });
        }
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

    getDriverData(driver: DriverData) {
        return this.driverMap.get(driver);
    }

    getAllDriverData() {
        return [...this.driverMap.values()].sort((a,b)=>a.finishingPosition-b.finishingPosition);
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
    timeType: "finish" | "from_leader" | "lapped" | "none" | "did_not_finish" | "did_not_start" | "disqualified",
    penaltyTime: number,
}
const Priority = {
    "finish": 1,
    "from_leader": 1,
    "lapped": 3,
    "none": 4,
    "did_not_finish": 5,
    "did_not_start": 6,
    "disqualified": 7,
} satisfies Record<RaceDriverData["timeType"], number>