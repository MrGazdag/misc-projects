import {GLProgram, GLRenderer} from "@mrgazdag/gl-lite";
import headerLineVsh from "./HeaderLineComponent.vsh";
import headerLineFsh from "./HeaderLineComponent.fsh";
import AbstractComponent from "./AbstractComponent";
import {ComponentContext} from "../F1Renderer";
export default class HeaderLineComponent extends AbstractComponent {
    private program!: GLProgram<InterpolatedImageProps>;

    shouldRender(context: ComponentContext): boolean {
        return context.mode.checkValue(e=>e>0);
    }

    init(renderer: GLRenderer, context: ComponentContext): void {
        // Create a shader program
        this.program = this.createRect<InterpolatedImageProps>(renderer, context, {
            vert: headerLineVsh,
            frag: headerLineFsh,
            uniforms: {
                iTime: props => props.time,
                iResolution: props => props.screen,
                iMode: props=>props.mode,
            },
        });
    }
    render(renderer: GLRenderer, context: ComponentContext): void {
        this.program.draw({
            time: context.time.delta,
            screen: context.screen,
            mode: context.mode.asVec4(),
        });
    }

    dispose() {
        this.program.dispose();
    }
}
interface InterpolatedImageProps {
    time: number;
    screen: [number, number];
    mode: [number, number, number, number];
}