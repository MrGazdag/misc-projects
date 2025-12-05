import React from "react";
import {Component} from "react";
import CanvasRenderer from "../../../common/components/CanvasRenderer";
import F1Renderer from "./api/F1Renderer";
import "./App.scss";
import Utils from "../../../common/Utils";

export default class App extends Component<AppProps> {
    private keyDownHandler: (e: KeyboardEvent)=>void;
    constructor(props: AppProps) {
        super(props);

        this.keyDownHandler = (e)=>{
            const keys = "0123456789";
            const raceKeys = "qwertzuiop";
            for (let key of keys) {
                if (e.key == key) {
                    this.props.app.getMode().setValue(parseInt(key));
                    break;
                }
            }
            for (let i = 0; i < raceKeys.length; i++){
                let key = raceKeys[i];
                if (e.key == key) {
                    let max = this.props.app.getGameData().getActualRaceCount();
                    let value = Utils.clamp(i, 0, max);
                    this.props.app.getRaceIndex().setValue(value);
                }
            }
        };
    }
    componentDidMount() {
        addEventListener("keydown", this.keyDownHandler);
    }
    componentWillUnmount() {
        removeEventListener("keydown", this.keyDownHandler);
    }

    render() {
        return <div className="app">
            <div style={{fontFamily: "Formula1"}}>
                szilya
            </div>
            <CanvasRenderer type={"webgl2"} options={{
                antialias: true,
                alpha: true,
                preserveDrawingBuffer: true,
                depth: false
            }} renderFunc={(ctx)=>{
                this.props.app.render(ctx);
            }}/>
        </div>;
    }
}
interface AppProps {
    app: F1Renderer
}