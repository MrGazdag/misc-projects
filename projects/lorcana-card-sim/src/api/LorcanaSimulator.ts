import {LorcanaCard, LorcanaDeck} from "./LorcanaTypes";

export default class LorcanaSimulator {
    private readonly deck: LorcanaDeck;

    private readonly allCards: LorcanaCardInstance[];
    private altered: boolean;
    ui: Set<()=>void>;

    constructor(deck: LorcanaDeck) {
        this.deck = deck;

        this.altered = false;
        this.allCards = deck.cards.map((e,i)=>({
            id: i,
            state: "deck",
            card: e,
            lastGroupAction: -1,
            ui: new Set()
        }));

        this.ui = new Set();
        this.reset();
    }

    public getCardsByState(state: CardState | CardState[]) {
        let result;
        if (Array.isArray(state)) {
            result = this.allCards.filter(e=>state.includes(e.state));
        } else {
            result = this.allCards.filter(e=>e.state == state);
        }

        return result.sort((a,b)=>a.lastGroupAction - b.lastGroupAction);
    }

    reset() {
        for (let card of this.allCards) {
            card.lastGroupAction = -1;
            card.state = "deck";
        }
        this.allCards.sort(()=>Math.random()-0.5);
        this.altered = false;

        for (let i = 0; i < 7; i++) {
            this.draw();
        }
    }

    alter() {
        let altering = this.getCardsByState("alter_marked");
        if (altering.length > 0) {
            this.altered = true;
            for (let card of altering) {
                card.lastGroupAction = Date.now();
                card.state = "altered";
            }
            for (let i = 0; i < altering.length; i++) {
                this.draw();
            }
        }
    }

    performAction(card: LorcanaCardInstance, action: CardActions) {
        console.log(card, "->", action);
        if (action == "unmark_alter") {
            card.state = "hand";
        } else if (action == "mark_alter") {
            card.state = "alter_marked";
        } else if (action == "discard") {
            card.lastGroupAction = Date.now();
            card.state = "discard";
        } else if (action == "quest") {
            card.state = "quest";
        } else if (action == "play") {
            card.lastGroupAction = Date.now();
            card.state = "played";
        } else if (action == "ink") {
            card.lastGroupAction = Date.now();
            card.state = "inked";
        } else if (action == "ink_use") {
            card.state = "inked_used";
        }
        this.updateCard(card);
    }

    nextTurn() {
        for (let card of this.getCardsByState("inked_used")) {
            card.state = "inked";
            this.updateCard(card)
        }
        for (let card of this.getCardsByState("quest")) {
            card.state = "played";
            this.updateCard(card)
        }
        this.draw();
    }

    draw() {
        let deckCards = this.getCardsByState("deck");
        if (deckCards.length == 0) return null;
        deckCards.sort(()=>Math.random()-0.5);
        let card = deckCards[0];
        card.lastGroupAction = Date.now();
        card.state = "hand";
        this.updateCard(card);
        return card;
    }

    public canDraw() {
        return this.cardsInDeckCount() > 0;
    }

    public cardsInDeckCount() {
        return this.getCardsByState("deck").length;
    }

    private updateCard(card: LorcanaCardInstance) {
        for (let uiCallback of card.ui) {
            uiCallback();
        }
        this.update();
    }

    private update() {
        for (let uiCallback of this.ui) {
            uiCallback();
        }
    }

    randomCard() {
        return this.allCards[Math.floor(Math.random()*this.allCards.length)];
    }

    hasAltered() {
        return this.altered;
    }
}
export interface LorcanaCardInstance {
    id: number;
    state: CardState;
    card: LorcanaCard;
    lastGroupAction: number;
    ui: Set<()=>void>;
}
export type CardState = "deck" | "hand" | "discard" | "inked" | "inked_used" | "quest" | "played" | "alter_marked" | "altered";
export type CardActions = "unmark_alter" | "mark_alter" | "discard" | "quest" | "play" | "ink" | "ink_use";
export const StateToActions: Record<CardState,CardActions[]> = {
    altered: [],
    deck: [],
    discard: [],
    hand: ["mark_alter", "discard", "play", "ink"],
    inked: ["ink_use"],
    inked_used: [],
    quest: [],
    played: ["quest","discard","ink"],
    alter_marked: ["unmark_alter"]
}
export const ActionsToName: Record<CardActions,string> = {
    unmark_alter: "Unmark for Alter",
    mark_alter: "Mark for Alter",
    discard: "Discard",
    quest: "Quest",
    play: "Play",
    ink: "Ink",
    ink_use: "Use Ink"
}