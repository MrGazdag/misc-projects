import Lobby from "./Lobby";

export default class MaganFoglalo {
    private lobby: Lobby | null;

    constructor() {
        this.lobby = null;
    }

    getLobby() {
        return this.lobby;
    }
}