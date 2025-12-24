import GamePlayer from "./GamePlayer";
import LobbyPlayer from "../lobby/LobbyPlayer";
import Lobby from "../lobby/Lobby";
import PlayerRole from "../../../common/PlayerRole";
import {GameS2CPackets, TeamColorValue} from "../../../common/GamePackets";
import QuestionData, {MultiChoiceQuestionData, NumberQuestionData, QuestionDataAnswer} from "../../../common/QuestionData";

export default class Game {
    private lobby: Lobby;
    private allPlayers: GamePlayer[];

    private gameMaster: GamePlayer;
    private players: GamePlayer[];
    private spectators: GamePlayer[];

    private currentQuestion: CurrentQuestion | null;
    private active: boolean;

    constructor(lobby: Lobby, players: LobbyPlayer[]) {
        this.lobby = lobby;

        this.allPlayers = players.map(e=>new GamePlayer(this, e));

        let possibleGM = this.allPlayers.find(p=>p.getRole() === PlayerRole.GAME_MASTER);
        if (!possibleGM) throw new Error("No game master found in lobby");

        this.gameMaster = possibleGM;
        this.players = this.allPlayers.filter(p=>p.getRole() == PlayerRole.PLAYER);
        this.spectators = this.allPlayers.filter(p=>p.getRole() == PlayerRole.SPECTATOR);

        this.currentQuestion = null;
        this.active = true;
    }

    private remapQuestionWithoutAnswers(question: QuestionDataAnswer): QuestionData {
        if (question.type == "multi_choice") {
            return {
                type: question.type,
                text: question.text,
                answers: question.answers
            } as MultiChoiceQuestionData;
        } else if (question.type == "number") {
            return {
                type: question.type,
                text: question.text
            } as NumberQuestionData;
        }
        throw new Error("Unknown question type");
    }
    setQuestion(question: QuestionDataAnswer, targetColors: TeamColorValue[]) {
        if (this.currentQuestion !== null) return;
        let targetPlayers = this.players.filter(p=>targetColors.includes(p.getTeam()!));
        this.currentQuestion = {
            question: question,
            startTime: Date.now(),
            targetPlayers: targetPlayers,
            answers: new Map()
        };
        this.broadcastPacket({
            type: "game:show_question",
            question: this.remapQuestionWithoutAnswers(question),
            targetPlayers: targetPlayers.map(e=>e.getTeam()!)
        });
        setTimeout(()=>{
            let record: Record<string, AnswerData> = {};
            for (let [player,answer] of this.currentQuestion!.answers) {
                record[player.getTeam()!] = answer;
            }
            this.broadcastPacket({
                type: "game:question_reveal",
                correct: question.correct,
                answers: record as Record<TeamColorValue, AnswerData>
            });

            // TODO maybe not another timeout idk
            setTimeout(()=>{
                this.currentQuestion = null;
            }, 5_000)
        }, 10_000);
    }
    setAnswer(player: GamePlayer, answer: number) {
        if (!this.currentQuestion) throw new Error("No question set");
        let time = this.currentQuestion.startTime-Date.now();
        this.currentQuestion.answers.set(player, {
            time: time,
            answer: answer
        });
        this.broadcastPacket({
            type: "game:question_someone_answered",
            time: time,
            player: player.getTeam()!
        });
    }

    getPlayers() {
        return this.allPlayers;
    }
    getCurrentQuestion() {
        return this.currentQuestion;
    }

    broadcastPacket<K extends keyof GameS2CPackets>(packet: GameS2CPackets[K], filter?: GamePlayer) {
        if (!this.active) return;
        for (let player of this.lobby.getPlayers().values()) {
            if (filter && filter.getLobbyPlayer() !== player) continue;
            player.getClient()?.sendPacket(packet);
        }
    }

    isActive() {
        return this.active;
    }
    stop() {
        this.active = false;
    }
}
interface CurrentQuestion {
    targetPlayers: GamePlayer[];
    startTime: number;
    question: QuestionDataAnswer;
    answers: Map<GamePlayer, AnswerData>;
}
interface AnswerData {
    time: number,
    answer: number
}