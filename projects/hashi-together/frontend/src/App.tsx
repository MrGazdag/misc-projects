import "./App.scss";
import React, {Component} from "react";
import CanvasRenderer from "../../../../common/components/CanvasRenderer";
import HashiRenderer from "./api/HashiRenderer";

export default class App extends Component<AppProps> {
    constructor(props: AppProps) {
        super(props);
    }
    render() {
        return <div className="app">
            <CanvasRenderer type="2d" renderFunc={(r)=>{
                this.props.renderer.render(r);
            }}/>
        </div>;
    }
}
interface AppProps {
    renderer: HashiRenderer;
}