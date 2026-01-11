import React from "react";
import {Component} from "react";
import CanvasRenderer from "../../../common/components/CanvasRenderer";
import F1Renderer, {RecordOptions} from "./api/F1Renderer";
import "./App.scss";
import Utils from "../../../common/Utils";
import {Editor} from "@monaco-editor/react";
import * as monaco_editor from 'monaco-editor';
import game_data_schema from "./game_data.schema.json";

export default class App extends Component<AppProps, AppState> {
    private overlayCloseHandler: (()=>Promise<void>) | null;
    private keyDownHandler: (e: KeyboardEvent)=>void;
    private recording: RecordOptions | null;
    constructor(props: AppProps) {
        super(props);
        this.overlayCloseHandler = null;
        this.recording = null;

        this.state = {
            tabOpen: null
        };

        this.keyDownHandler = (e)=>{
            if (this.state.tabOpen != null) {
                if (e.key == "Escape") {
                    this.closeOverlay();
                }
                return;
            }
            if (e.key == "Tab") {
                this.setState({tabOpen: "data"});
            }
            if (e.key == "Enter") {
                this.setState({tabOpen: "record"});
            }
            // Manage animation
            const keys = "0123456789";
            const raceKeys = "qwertzuiop";
            for (let key of keys) {
                if (e.key == key) {
                    this.props.app.getMode().setValue(parseInt(key));
                    return;
                }
            }
            for (let i = 0; i < raceKeys.length; i++){
                let key = raceKeys[i];
                if (e.key == key) {
                    let max = this.props.app.getGameData().getActualRaceCount();
                    let value = Utils.clamp(i, 0, max+1);
                    this.props.app.getRaceIndex().setValue(value-1);
                    return;
                }
            }
        };
    }
    private async closeOverlay() {
        await this.overlayCloseHandler?.();
        this.overlayCloseHandler = null;
        this.setState({tabOpen: null});
    }
    componentDidMount() {
        addEventListener("keydown", this.keyDownHandler);
    }
    componentWillUnmount() {
        removeEventListener("keydown", this.keyDownHandler);
    }

    render() {
        let overlay = null;
        if (this.state.tabOpen == "record") {
            let recordResult = this.props.app.getRecordResult();

            let widthRef = React.createRef<HTMLInputElement>();
            let heightRef = React.createRef<HTMLInputElement>();
            let fpsRef = React.createRef<HTMLInputElement>();
            let durationRef = React.createRef<HTMLInputElement>();
            overlay = <div className="_overlay record">
                <label style={{backgroundColor: "white",padding: "10px"}}>Width (pixels)</label>
                <input style={{marginBottom: "20px",padding: "10px"}} type="number" ref={widthRef} step={1} placeholder="Width" defaultValue="1080"/>
                <label style={{backgroundColor: "white",padding: "10px"}}>Height (pixels)</label>
                <input style={{marginBottom: "20px",padding: "10px"}} type="number" ref={heightRef} step={1} placeholder="Height" defaultValue="1080"/>
                <label style={{backgroundColor: "white",padding: "10px"}}>FPS</label>
                <input style={{marginBottom: "20px",padding: "10px"}} type="number" ref={fpsRef} placeholder="FPS" defaultValue="60"/>
                <label style={{backgroundColor: "white",padding: "10px"}}>Duration (Seconds)</label>
                <input style={{marginBottom: "20px",padding: "10px"}} type="number" ref={durationRef} placeholder="Duration" defaultValue="20"/>
                <button onClick={()=>{
                    this.recording = {
                        width: 1080,
                        height: 1080,
                        seconds: durationRef.current!.valueAsNumber,
                        fps: fpsRef.current!.valueAsNumber
                    };
                }} disabled={this.props.app.isRecording()}>Record</button>
                {recordResult == null ? null : <div>
                    <h2>Result</h2>
                    {recordResult.type == "download" ? <a href={recordResult.url} download={recordResult.name}>Download</a> : <video style={{height: "200px"}} src={recordResult.url} autoPlay muted loop></video>}
                </div>}
            </div>;
        } else if (this.state.tabOpen == "data") {
            overlay = <div className="_overlay data">
                <Editor defaultLanguage="json"
                        className="_game_data_editor"
                        height="auto"
                        defaultValue={this.props.app.getRawGameData()}
                        theme="vs-dark"
                        path="game_data.json"
                        onMount={(editor, monaco: typeof monaco_editor)=>{
                            monaco.json.jsonDefaults.setDiagnosticsOptions({
                                validate: true,
                                schemaValidation: "error",
                                allowComments: false,
                                schemas: [
                                    {
                                        uri: "inmemory://schemas/game_data.schema.json",
                                        fileMatch: ["game_data.json"],
                                        schema: game_data_schema
                                    }
                                ],
                            })
                        }}
                        onChange={(newValue)=>{
                            this.overlayCloseHandler = async ()=>{
                                try {
                                    await this.props.app.setRawData(newValue!);
                                } catch (e) {
                                    console.error(e);
                                    alert("Invalid JSON: " + e);
                                }
                            };
                        }} />
                <button onClick={()=>{
                    this.closeOverlay();
                }}>Display</button>
            </div>;
        }
        return <div className="app">
            <div style={{fontFamily: "Formula1"}}>
            </div>
            <CanvasRenderer type={"webgl2"} options={{
                antialias: true,
                alpha: true,
                preserveDrawingBuffer: true,
                depth: false
            }} renderFunc={async (ctx)=>{
                if (this.recording) {
                    let data = this.recording;
                    this.recording = null;
                    this.props.app.record(ctx, data).then(()=>{
                        this.setState({
                            tabOpen: "record"
                        })
                    });
                    this.forceUpdate();
                }
                if (!this.props.app.isRecording()) {
                    this.props.app.render(ctx);
                }
            }}/>

            {overlay}
        </div>;
    }
}
interface AppProps {
    app: F1Renderer
}
interface AppState {
    tabOpen: TabType | null
}
type TabType = "record" | "data";