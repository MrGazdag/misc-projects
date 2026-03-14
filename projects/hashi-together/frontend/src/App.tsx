import "./App.scss";
import React, {Component, MouseEventHandler} from "react";
import CanvasRenderer from "../../../../common/components/CanvasRenderer";
import HashiRenderer from "./api/HashiRenderer";

export default class App extends Component<AppProps> {
    private clickHandler: MouseEventHandler<HTMLCanvasElement>;
    constructor(props: AppProps) {
        super(props);
        this.clickHandler = (e) => {
            e.preventDefault();

            const rect = e.currentTarget.getBoundingClientRect();

            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            this.props.renderer.click(e.currentTarget, x, y, e.button == 2);
        };
    }
    render() {
        return <div className="app">
            <CanvasRenderer type="2d" renderFunc={(r)=>{
                this.props.renderer.render(r);
            }} onClick={e=>this.clickHandler(e)}
                onContextMenu={e=>this.clickHandler(e)}
            />
        </div>;
    }
}
interface AppProps {
    renderer: HashiRenderer;
}