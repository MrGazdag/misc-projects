import {Packet} from "./PacketUtils";

export interface RawPlayerData {
    id: string,
    name: string,
    team: string | null,
    role: string,
    ready: boolean,
    connected: boolean,
    self: boolean
}

export type LobbyC2SPlayerSelfUpdatePacket = {
    type: "lobby:player_self_update",
    name: string,
    ready: boolean
}
export type LobbyC2SQuitPacket = {
    type: "lobby:quit"
}
export type LobbyS2CPlayerJoinPacket = {
    type: "lobby:player_join",
    data: RawPlayerData
}
export type LobbyS2CPlayerLeavePacket = {
    type: "lobby:player_leave",
    id: string
}
export type LobbyS2CPlayerUpdatePacket = {
    type: "lobby:player_update",
    data: RawPlayerData
}
export type LobbyS2CLobbyInitPacket = {
    type: "lobby:lobby_init",
    players: RawPlayerData[]
}
export type LobbyS2CStartGamePacket = {
    type: "lobby:start_game"
}
export type LobbyS2CEndGamePacket = {
    type: "lobby:end_game"
}
export type LobbyC2SSetPlayerPacket = {
    type: "lobby:set_player",
    target: string, // player id
    team: "red" | "green" | "blue" | null,
    role: "player" | "spectator" | "game_master"
}

export type LobbyC2SPackets =
    & Packet<LobbyC2SPlayerSelfUpdatePacket>
    & Packet<LobbyC2SQuitPacket>
    & Packet<LobbyC2SSetPlayerPacket>
;

export type LobbyS2CPackets =
    & Packet<LobbyS2CPlayerUpdatePacket>
    & Packet<LobbyS2CLobbyInitPacket>
    & Packet<LobbyS2CPlayerJoinPacket>
    & Packet<LobbyS2CPlayerLeavePacket>
    & Packet<LobbyS2CStartGamePacket>
    & Packet<LobbyS2CEndGamePacket>
;

export type LobbyC2SPacket = LobbyC2SPackets[keyof LobbyC2SPackets];
export type LobbyS2CPacket = LobbyS2CPackets[keyof LobbyS2CPackets];