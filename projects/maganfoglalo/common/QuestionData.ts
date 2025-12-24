export type MultiChoiceQuestionData = {
    type: "multi_choice",
    text: string,
    answers: string[]
}
export type MultiChoiceQuestionDataAnswer = MultiChoiceQuestionData & {
    correct: number
}
export type NumberQuestionData = {
    type: "number",
    text: string,
}
export type NumberQuestionDataAnswer = NumberQuestionData & {
    correct: number,
    botRange?: [number, number],
}
type QuestionData = MultiChoiceQuestionData | NumberQuestionData;
export default QuestionData;
export type QuestionDataAnswer = MultiChoiceQuestionDataAnswer | NumberQuestionDataAnswer;