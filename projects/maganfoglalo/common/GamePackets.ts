import {Packet} from "./PacketUtils";
import QuestionData, {QuestionDataAnswer} from "./QuestionData";

export type TeamColorValue = "red" | "green" | "blue";
export interface GameC2SMultiChoiceAnswerPacket {
    type: "game:multi_choice_answer",
    answer: number
}

export interface GameC2SNumberAnswerPacket {
    type: "game:number_answer",
    answer: number
}

export interface GameS2CShowQuestionPacket {
    type: "game:show_question",
    question: QuestionData,
    targetPlayers: TeamColorValue[]
}

export interface GameS2CQuestionSomeoneAnsweredPacket {
    type: "game:question_someone_answered",
    time: number,
    player: TeamColorValue,
}
export interface GameS2CQuestionRevealAllPacket {
    type: "game:question_reveal",
    correct: number,
    answers: Record<TeamColorValue,{
        time: number,
        answer: number
    }>
}

export interface GameC2SGMSendQuestionPacket {
    type: "game:send_question",
    question: QuestionDataAnswer,
    targetPlayers: TeamColorValue[]
}


export type GameC2SPackets =
    & Packet<GameC2SMultiChoiceAnswerPacket>
    & Packet<GameC2SNumberAnswerPacket>
    & Packet<GameC2SGMSendQuestionPacket>
;

export type GameS2CPackets =
    & Packet<GameS2CShowQuestionPacket>
    & Packet<GameS2CQuestionSomeoneAnsweredPacket>
    & Packet<GameS2CQuestionRevealAllPacket>
;

export type GameC2SPacket = GameC2SPackets[keyof GameC2SPackets];
export type GameS2CPacket = GameS2CPackets[keyof GameS2CPackets];