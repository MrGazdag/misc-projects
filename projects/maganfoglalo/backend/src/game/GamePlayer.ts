import LobbyPlayer from "../lobby/LobbyPlayer";
import Game from "./Game";
import TeamColor from "../../../common/TeamColor";
import PlayerRole from "../../../common/PlayerRole";
import {GameC2SPacket, GameS2CPackets} from "../../../common/GamePackets";

export default class GamePlayer {
    private readonly game: Game;
    private readonly lobby: LobbyPlayer;

    private readonly team: TeamColor | null;
    private readonly role: PlayerRole;

    constructor(game: Game, lobby: LobbyPlayer) {
        this.game = game;
        this.lobby = lobby;

        this.team = lobby.getTeam();
        this.role = lobby.getRole();

        lobby.setCustomPacketHandler((e: GameC2SPacket)=>{
            if (e.type == "game:send_question") {
                if (this.role !== PlayerRole.GAME_MASTER) throw new Error("Only GM can send questions");
                this.game.setQuestion(e.question, e.targetPlayers);
            } else if (e.type == "game:multi_choice_answer") {
                this.game.setAnswer(this, e.answer);
            } else if (e.type == "game:number_answer") {
                this.game.setAnswer(this, e.answer);
            }
        });
    }

    getGame() {
        return this.game;
    }
    getLobbyPlayer() {
        return this.lobby;
    }

    sendPacket<K extends keyof GameS2CPackets>(packet: GameS2CPackets[K]) {
        if (!this.game.isActive()) return;
        this.lobby.getClient()?.sendPacket(packet);
    }

    getTeam() {
        return this.team;
    }
    getRole() {
        return this.role;
    }
}