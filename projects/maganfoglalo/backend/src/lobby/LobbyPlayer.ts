import NetworkClient from "../NetworkClient";
import TeamColor from "../../../common/TeamColor";
import PlayerRole from "../../../common/PlayerRole";
import Utils from "../../../common/Utils";
import Lobby from "./Lobby";
import {LobbyC2SPacket, LobbyS2CPacket, LobbyS2CPackets, RawPlayerData} from "../../../common/LobbyPackets";

export default class LobbyPlayer {
    private readonly lobby: Lobby;

    // Game assigned
    /**
     * Public ID of the player.
     */
    private id: string;
    /**
     * Rejoin secret of the player
     */
    private secret: string;
    /**
     * Network client of the player.
     * Can be null if the player is not connected.
     * Can reconnect with the secret.
     */
    private client: NetworkClient | null;

    // Self assigned
    private name: string;
    private ready: boolean;

    // GM assigned
    private team: TeamColor | null;
    private role: PlayerRole;

    private active: boolean;
    private customPacketHandler: (e: any)=>void;
    constructor(lobby: Lobby, id: string, client: NetworkClient, name: string) {
        this.lobby = lobby;
        this.id = id;

        this.client = client;
        this.name = name;
        this.secret = Utils.generateKey(32);

        this.team = null;
        this.role = PlayerRole.SPECTATOR;
        this.ready = false;

        this.active = true;
        this.customPacketHandler = ()=>{};
        this.handleClient(client);
    }
    private handleClient(client: NetworkClient) {
        client.setDisconnectHandler(()=>{
            this.client = null;
            this.broadcastUpdate(false);
        });
        client.setHandler((p)=>{
            this.handlePackets(p);
            this.customPacketHandler(p);
            throw new Error("Unknown packet");
        });
    }
    private handlePackets(packet: LobbyC2SPacket) {
        if (packet.type == "lobby:player_self_update") {
            this.name = packet.name;
            this.ready = packet.ready;
            this.broadcastUpdate(true);
        } else if (packet.type == "lobby:quit") {
            this.kick();
        } else if (packet.type == "lobby:set_player") {
            if (this.role !== PlayerRole.GAME_MASTER) throw new Error("Only GM can set players");
            let target = this.lobby.getPlayer(packet.target);
            if (!target) throw new Error("Unknown player");

        }
    }
    private broadcastUpdate(includeSelf: boolean) {
        if (!this.active) return;
        this.lobby.broadcastPacket({
            type: "lobby:player_update",
            data: this.serialize()
        }, includeSelf ? undefined : this);
    }
    serialize(): RawPlayerData {
        return {
            id: this.id,
            name: this.name,
            team: this.team,
            role: this.role,
            ready: this.ready,
            connected: this.isConnected(),
            self: false
        };
    }

    getId() {
        return this.id;
    }
    getSecret() {
        return this.secret;
    }
    getClient() {
        return this.client;
    }
    setClient(client: NetworkClient) {
        if (this.client !== null) {
            this.client.disconnect();
        }
        this.client = client;
        this.handleClient(client);
        this.broadcastUpdate(false);
    }
    getName() {
        return this.name;
    }
    isReady() {
        return this.ready;
    }

    setRole(role: PlayerRole) {
        this.role = role;
        this.broadcastUpdate(true);
    }
    setTeam(team: TeamColor) {
        this.team = team;
        this.broadcastUpdate(true);
    }
    setPlayerInfo(team: TeamColor, role: PlayerRole) {
        this.team = team;
        this.role = role;
        this.broadcastUpdate(true);
    }

    isConnected() {
        return this.client !== null;
    }

    sendPacket<K extends keyof LobbyS2CPackets>(packet: LobbyS2CPackets[K]) {
        if (!this.active) return;
        this.client?.sendPacket(packet);
    }
    kick() {
        this.lobby.removePlayer(this);
        this.active = false;
        if (this.isConnected()) {
            this.client!.disconnect();
        }
    }
    isActive() {
        return this.active;
    }

    getTeam() {
        return this.team;
    }
    getRole() {
        return this.role;
    }

    setCustomPacketHandler(handler: (e: any)=>void) {
        this.customPacketHandler = handler;
    }

    unready() {
        this.ready = false;
        this.broadcastUpdate(true);
    }
}