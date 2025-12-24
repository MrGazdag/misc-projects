import NetworkClient from "./NetworkClient";
import Lobby from "./lobby/Lobby";
import Utils from "../../common/Utils";
import WebSocket from "ws";
import {LoginC2SHelloPacket} from "../../common/LoginPackets";

export default class MaganfoglaloBackend {
    private lobbies: Map<string, Lobby>;
    constructor() {
        this.lobbies = new Map();
    }
    createLobby() {
        let key;
        do {
            key = Utils.generateKey(6);
        } while (this.lobbies.has(key));

        let lobby = new Lobby(this, key);
        console.log("created lobby: ", lobby.getKey());
        this.lobbies.set(key, lobby);
        return lobby;
    }

    getLobby(key: string) {
        return this.lobbies.get(key);
    }
    removeLobby(lobby: Lobby) {
        this.lobbies.delete(lobby.getKey());
    }
    public handleClient(ws: WebSocket) {
        console.log("some client connected");
        let client = new NetworkClient(ws, (e: LoginC2SHelloPacket)=>{
            console.log("hello? ", e);
            if (e.type === "hello") {
                let lobbyKey = e.key;
                let lobby = this.lobbies.get(lobbyKey);
                if (!lobby) throw new Error("Unknown lobby: " + lobbyKey);

                lobby.connectNewPlayer(client, e.name);
                return;
            }
            throw new Error("Unknown packet type");
        });

    }
}