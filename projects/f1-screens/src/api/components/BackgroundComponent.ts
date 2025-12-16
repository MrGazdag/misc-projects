import {GLProgram, GLRenderer} from "@mrgazdag/gl-lite";
import backgroundVsh from "./BackgroundComponent.vsh";
import backgroundFsh from "./BackgroundComponent.fsh";
import AbstractComponent from "./AbstractComponent";
import {ComponentContext} from "../F1Renderer";
export default class BackgroundComponent extends AbstractComponent {
    private program!: GLProgram<BackgroundProps>;

    shouldRender(context: ComponentContext): boolean {
        return context.mode.checkValue(e=>e>0);
    }

    init(renderer: GLRenderer, context: ComponentContext): void {
        // Create a shader program
        this.program = this.createRect<BackgroundProps>(renderer, context, {
            vert: backgroundVsh,
            frag: backgroundFsh,
            uniforms: {
                iTime: props => props.time,
                iResolution: props => props.screen,
                iMode: props=>props.mode,
                //cursor: props=>props.cursor
            },
        });
    }
    render(renderer: GLRenderer, context: ComponentContext): void {
        this.program.draw({
            time: context.time.delta,
            screen: context.screen,
            mode: context.mode.asVec4(),
            //cursor: context.pointer,
        });
    }

    dispose() {
        this.program.dispose();
    }
}
interface BackgroundProps {
    time: number;
    screen: [number, number];
    mode: [number, number, number, number],
    //cursor: [number,number];
}
