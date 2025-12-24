import React, {Component} from "react";
import "./LobbyPage.scss";
import Lobby from "../../api/Lobby";

export default class LobbyPage extends Component<LobbyProps> {
    constructor(props: LobbyProps) {
        super(props);
    }

    render() {
        return <div className="page-lobby">

        </div>;
    }
}
interface LobbyProps {
    lobby: Lobby
}