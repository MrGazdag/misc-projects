import React from "react";
import "./App.scss";
import CardRenderer from "./CardRenderer";
import LorcanaApi from "./api/LorcanaApi";
import {Component} from "react";
import LorcanaSimulator from "./api/LorcanaSimulator";
import SimulatorRenderer from "./SimulatorRenderer";

export default class App extends Component<AppProps, AppState> {
    private handler: ()=>void;
    constructor(props: AppProps) {
        super(props);
        this.handler = ()=>{
            this.forceUpdate();
        };
        this.state = {
            sim: new LorcanaSimulator(props.api.getDeckParseResults().deck),
            simIndex: 0
        };
    }

    componentDidMount() {
        this.props.api.addUiHandler(this.handler);
    }

    componentWillUnmount() {
        this.props.api.removeUiHandler(this.handler);
    }

    resetSim() {
        this.setState({
            sim: new LorcanaSimulator(this.props.api.getDeckParseResults().deck),
            simIndex: this.state.simIndex + 1
        });
    }

    render() {
        let api = this.props.api;
        return <div className="app">
            <div className="_inputs">
                <h1>Inputs</h1>
                <div>
                    <div>
                        <h2>Extra Card Meta</h2>
                        <div>
                        <textarea defaultValue={DefaultExtraCards} onInput={(e)=>{
                            let text = e.target as HTMLTextAreaElement;
                            api.setExtraCards(text.value);
                            this.resetSim();
                        }}/>
                            <div>
                                <p>Loaded {api.getExtraCardsResults().cards.length} extra card{api.getExtraCardsResults().cards.length == 1 ? "" : "s"}.</p>
                                <p>{api.getExtraCardsResults().error ?? "No errors found."}</p>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h2>Deck</h2>
                        <div>
                        <textarea defaultValue={DefaultDeck} onInput={(e)=>{
                            let text = e.target as HTMLTextAreaElement;
                            api.parseDeck(text.value);
                            this.resetSim();
                        }}/>
                            <div>
                                <p>Loaded {api.getDeckParseResults().deck.cards.length} card{api.getDeckParseResults().deck.cards.length == 1 ? "" : "s"}.</p>
                                {
                                    api.getDeckParseResults().missing.length == 0
                                        ? <p>All deck cards were imported successfully.</p>
                                        : <>
                                            <p>The following cards were not found:</p>
                                            <ul>
                                                {api.getDeckParseResults().missing.map((card, i)=>{
                                                    return <li key={i+""}>{card}</li>;
                                                })}
                                            </ul>
                                        </>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <SimulatorRenderer key={this.state.simIndex+""} simulator={this.state.sim}/>
        </div>;
    }
}
interface AppProps {
    api: LorcanaApi;
}
interface AppState {
    sim: LorcanaSimulator;
    simIndex: number;
}
interface MorseValue {
    word: string,
    frequency: number,
    wordMorseMapped: boolean[],
    wordMorseMappedLong: boolean[],
    matchStart: number | null
}

const DefaultExtraCards = `[{
    "Image": "https://cdn.dreamborn.ink/images/en/cards/010/6405ce4a96abee3111b1e53c28e11fab0d00e8e3",
    "Name": "Spooky Sight"
  },
{
    "Image": "https://cdn.dreamborn.ink/images/en/cards/010/8d6df8732abe1c376c007171fd4fce0eb5a02ed3",
    "Name": "He Hurled His Thunderbolt"
  },
{
    "Image": "https://cdn.dreamborn.ink/images/en/cards/010/3a5ef78547ed2f6954cb32d88295da8940f8f03e",
    "Name": "Goliath - Clan Leader"
  },
{
    "Image": "https://cdn.dreamborn.ink/images/en/cards/010/cc2a8eec3d007ff60083ce48c2a26394ec7b6253",
    "Name": "Cinderella - Dream Come True"
  }]`;

const DefaultDeck = `4 Captain Hook - Forceful Duelist
4 Mulan - Disguised Soldier
4 Sail The Azurite Sea
4 Tipo - Growing Son
4 Cinderella - Dream Come True
2 Spooky Sight
4 Hades - Infernal Schemer
4 Robin Hood - Unrivaled Archer
4 Goliath - Clan Leader
4 Jasmine - Fearless Princess
4 Namaari - Single-Minded Rival
4 Vincenzo Santorini - The Explosives Expert
4 He Hurled His Thunderbolt
4 Strength of a Raging Fire
1 Mufasa - Ruler of Pride Rock
3 Vision of the Future
2 Beyond the Horizon`;