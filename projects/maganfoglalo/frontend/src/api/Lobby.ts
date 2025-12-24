import Game from "./Game";

export default class Lobby {
    private game: Game | null;

    constructor() {
        this.game = null;
    }

    getGame() {
        return this.game;
    }
}