import Game from "./api/Game";
import React, {Component} from "react";
import "./GameRenderer.scss";
import CanvasRenderer from "../../../common/CanvasRenderer";

export default class GameRenderer extends Component<GameRendererProps> {
    constructor(props: GameRendererProps) {
        super(props);
    }

    render() {
        return <div className="game">
            <div>

            </div>
            <CanvasRenderer renderFunc={(ctx)=>this.props.game.render(ctx)}/>
        </div>;
    }
}
interface GameRendererProps {
    game: Game;
}