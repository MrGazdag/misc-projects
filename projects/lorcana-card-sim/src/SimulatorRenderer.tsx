import "./SimulatorRenderer.scss";
import React from "react";
import LorcanaSimulator from "./api/LorcanaSimulator";
import {Component} from "react";
import CardRenderer from "./CardRenderer";
import CardStackRenderer from "./CardStackRenderer";

export default class SimulatorRenderer extends Component<SimulatorRendererProps, any> {

    private readonly handler: ()=>void;
    constructor(props: SimulatorRendererProps) {
        super(props);

        this.handler = ()=>{
            this.forceUpdate();
        };
    }

    componentDidMount() {
        this.props.simulator.ui.add(this.handler);
    }
    componentWillUnmount() {
        this.props.simulator.ui.delete(this.handler);
    }

    render() {
        let sim = this.props.simulator;
        let hasAlterCards = sim.getCardsByState("alter_marked").length > 0;
        let remainingCards = sim.cardsInDeckCount();

        let played = sim.getCardsByState(["played", "quest"]);
        let inkwell = sim.getCardsByState(["inked", "inked_used"]);
        let inkUsedCount = inkwell.filter(e=>e.state == "inked_used").length;
        let discard = sim.getCardsByState("discard");
        let hand = sim.getCardsByState(["hand","alter_marked"]);

        return <div className="simulator">
            <h1>Simulator</h1>
            <CardStackRenderer simulator={this.props.simulator}
                               cards={played}
                               title={`Played Cards (${played.length} ${played.length == 1 ? "card" : "cards"})`}
                               className="_played"/>
            <div className="_cards _center">
                <CardStackRenderer simulator={this.props.simulator}
                                   cards={inkwell}
                                   title={`Inkwell (${inkUsedCount}/${inkwell.length} ink)`}
                                   className="_inkwell"/>
                <CardStackRenderer simulator={this.props.simulator}
                                   type={"stack"}
                                   cards={discard}
                                   title={`Discard Pile (${discard.length} ${discard.length == 1 ? "card" : "cards"})`}
                                   className="_discard"/>
            </div>
            <CardStackRenderer simulator={this.props.simulator}
                               cards={hand}
                               title={`Hand (${hand.length} ${hand.length == 1 ? "card" : "cards"})`}
                               className="_hand"/>
            <div className="_buttons">
                <button className={"_alter " + (sim.hasAltered() || !hasAlterCards ? "_greyed" : "_usable")} onClick={()=>{sim.alter()}}>{sim.hasAltered() ? "Already altered" : hasAlterCards ? "Alter" : "Mark cards to Alter"}</button>
                <button className="_reset" onClick={()=>{sim.reset();this.forceUpdate();}}>Reset</button>
                <button className={"_draw " + (remainingCards <= 0 ? "_greyed" : "_usable")} onClick={()=>{sim.draw()}}>Draw ({remainingCards + (remainingCards == 1 ? " card" : " cards")} in deck)</button>
                <button className="_nextTurn" onClick={()=>{sim.nextTurn()}}>Next Turn</button>
            </div>

        </div>
    }
}

interface SimulatorRendererProps {
    simulator: LorcanaSimulator
}