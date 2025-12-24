import React, {Component} from "react";
import "../../GameRenderer.scss";
import MaganFoglaloApi from "../../api/MaganFoglalo";

export default class MainMenuPage extends Component<MainMenuProps> {
    constructor(props: MainMenuProps) {
        super(props);
    }

    render() {
        return <div className="page-main-menu">
        </div>;
    }
}
interface MainMenuProps {
    api: MaganFoglaloApi;
}