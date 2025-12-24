import LobbyPlayer from "./LobbyPlayer";
import {LobbyS2CPackets} from "../../../common/LobbyPackets";
import NetworkClient from "../NetworkClient";
import Utils from "../../../common/Utils";
import MaganfoglaloBackend from "../MaganfoglaloBackend";
import Game from "../game/Game";
import PlayerRole from "../../../common/PlayerRole";

export default class Lobby {
    private readonly backend: MaganfoglaloBackend;
    private readonly key: string;
    private readonly players: Map<string,LobbyPlayer>;

    private game: Game | null;
    private autoCloseTimeout: NodeJS.Timeout | null;
    constructor(backend: MaganfoglaloBackend, key: string) {
        this.backend = backend;
        this.key = key;
        this.game = null;
        this.players = new Map();
        this.autoCloseTimeout = setTimeout(()=>{this.checkEmpty()}, 60_000);
    }

    getKey() {
        return this.key;
    }
    private sendLobbyInitPacket(player: LobbyPlayer) {
        player.sendPacket({
            type: "lobby:lobby_init",
            players: [...this.players.values()].map(p=>{
                let result = p.serialize();
                if (p == player) {
                    result.self = true;
                }
                return result;
            })
        });
    }

    connectNewPlayer(client: NetworkClient, name: string) {
        if (this.autoCloseTimeout) {
            clearTimeout(this.autoCloseTimeout);
            this.autoCloseTimeout = null;
        }

        let id;
        do {
            id = Utils.generateKey(10);
        } while (this.players.has(id));
        let player = new LobbyPlayer(this, id, client, name);

        this.players.set(id, player);
        this.broadcastPacket({
            type: "lobby:player_join",
            data: player.serialize()
        }, player);

        this.sendLobbyInitPacket(player);
        if (this.players.size == 1) player.setRole(PlayerRole.GAME_MASTER);

        return player;
    }
    connectExistingPlayer(client: NetworkClient, id: string, key: string) {
        let player = this.players.get(id);
        if (!player) throw new Error("Unknown player");
        if (player.getSecret() !== key) throw new Error("Invalid key");
        player.setClient(client);

        this.sendLobbyInitPacket(player);
    }

    broadcastPacket<K extends keyof LobbyS2CPackets>(packet: LobbyS2CPackets[K], filter?: LobbyPlayer) {
        for (let player of this.players.values()) {
            if (filter && filter !== player) continue;
            player.sendPacket(packet);
        }
    }

    getPlayers() {
        return this.players;
    }

    removePlayer(player: LobbyPlayer) {
        this.players.delete(player.getId());
        this.broadcastPacket({
            type: "lobby:player_leave",
            id: player.getId()
        });
        this.checkEmpty();
        this.checkGM();
    }

    checkEmpty() {
        let result = true;
        for (let value of this.players.values()) {
            if (value.isConnected()) {
                result = false;
                break;
            }
        }

        if (result) {
            this.backend.removeLobby(this)
        }
    }
    checkGM() {
        if (this.players.size > 0) return;
        let found = false;
        for (let value of this.players.values()) {
            if (value.getRole() == PlayerRole.GAME_MASTER) {
                found = true;
                break;
            }
        }
        if (found) return;

        let firstPlayer = [...this.players.values()][0];
        firstPlayer.setRole(PlayerRole.GAME_MASTER);
    }

    startGame() {
        if (this.game) return;
        for (let value of this.players.values()) {
            if (!value.isReady()) return;
        }

        this.broadcastPacket({
            type: "lobby:start_game"
        });
    }
    endGame() {
        if (!this.game) return;
        this.broadcastPacket({
            type: "lobby:end_game"
        });
        this.game.stop();
        this.game = null;
        for (let player of this.players.values()) {
            player.setCustomPacketHandler(()=>{});
            player.unready();
        }
    }

    getPlayer(target: string) {
        return this.players.get(target);
    }
}