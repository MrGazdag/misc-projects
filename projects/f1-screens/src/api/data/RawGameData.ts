export default interface RawGameData {
    teamData: RawTeamData[];
    drivers: RawDriverData[];
    raceResults: RawRaceResultsData[];
    reserveIconUrl: string;
    pointMap: Record<string, number>;
    name: string;
    plannedRaceCount: number;
}
export interface RawRaceResultsData {
    map: string;
    lapCount: number;
    driverData: {
        playerId: string,
        teamId: string,

        startingPosition: number | null,
        numberOfPitStops: number | null,
        bestLapTime: number | null,

        time: number | null,
        timeType: "finish" | "from_leader" | "lapped" | "did_not_finish" | "did_not_start" | "disqualified",
        penaltyTime: number
    }[]
}
export interface RawTeamData {
    id: string;

    name: string;
    iconUrl: string;
}
export interface RawDriverData {
    id: string;
    teamId: string | null;

    name: string;
    country: string;
    iconUrl: string;
}