import React, {Component} from "react";
import LorcanaSimulator, {LorcanaCardInstance} from "./api/LorcanaSimulator";
import CardRenderer from "./CardRenderer";
import "./CardStackRenderer.scss";

export default class CardStackRenderer extends Component<CardStackRendererProps> {
    render() {
        let className = "card-stack";
        className += " _type-" + (this.props.type ?? "side");
        if (this.props.className) className += " " + this.props.className;
        return <div className={className}>
            {this.props.title ? <h2>{this.props.title}</h2> : null}
            <div className="_cards">
                {this.props.cards.map(card=><CardRenderer card={card} simulator={this.props.simulator} key={card.id}/>)}
            </div>
        </div>;
    }
}

interface CardStackRendererProps {
    simulator: LorcanaSimulator,
    cards: LorcanaCardInstance[],
    type?: "horizontal" | "vertical" | "stack"
    title?: string,
    className?: string,
}