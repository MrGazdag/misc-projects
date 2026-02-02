export default interface RawGameData {
    teamData: RawTeamData[];
    drivers: RawDriverData[];
    raceResults: RawRaceData[];
    reserveIconUrl: string;
    pointMap: Record<string, number>;
    name: string;
}
export interface RawRaceData {
    map: string;
    mapFlag: string;
    lapCount: number;
    date: string;
    results: RawRaceResultsData | null
}
export interface RawRaceResultsData {
    driverData: {
        playerId: string,
        teamId: string,

        startingPosition: number | null,
        numberOfPitStops: number | null,
        bestLapTime: number | null,

        time: number | null,
        timeType: "finish" | "from_leader" | "lapped" | "did_not_finish" | "did_not_finish_no_points" | "did_not_start" | "disqualified",
        penaltyTime: number | null
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