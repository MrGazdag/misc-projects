import React, {Component} from "react";
import "./GamePage.scss";
import Lobby from "../../api/Lobby";

export default class GamePage extends Component<GameProps> {
    constructor(props: GameProps) {
        super(props);
    }

    render() {
        return <div className="page-game">

        </div>;
    }
}
interface GameProps {
    lobby: Lobby
}