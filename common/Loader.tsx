import React, {Component} from "react";
import "./Loader.scss";
import Spinner from "./Spinner";

export default class Loader<T> extends Component<LoaderProps<T>, LoaderState<T>> {
    private init: boolean;
    constructor(props: LoaderProps<T>) {
        super(props);
        this.init = false;

        this.handlePromise(props.promise);
        this.state = {
            lastRendered: undefined
        };
    }

    handlePromise(promise: Promise<T>) {
        promise.then(data=>{
            let result = this.props.children(data, undefined);
            this.updateState({
                lastRendered: result
            })
        }, e=>{
            let result = this.props.children(undefined, e);
            this.updateState({
                lastRendered: result
            })
        })
    }

    updateState(state: LoaderState<T>) {
        if (this.init) {
            this.setState(state);
        } else {
            this.state = state;
        }
    }

    componentDidMount() {
        this.init = true;
    }

    componentDidUpdate(prevProps: Readonly<LoaderProps<T>>, prevState: Readonly<LoaderState<T>>, snapshot?: any) {
        if (prevProps.promise !== this.props.promise) {
            this.updateState({
                lastRendered: this.state?.lastRendered
            });
        }
    }

    render() {
        let loaderContents = <div className={"loader" + (this.state.lastRendered ? " _loaded" : "")}>
            {this.props.bold ?
                <b>{this.props.text}</b>
                : <span>{this.props.text}</span>}
            <Spinner/>
        </div>;
        if (this.state.lastRendered) {
            return <>
                {loaderContents}
                {this.state.lastRendered}
            </>
        }
        return loaderContents;
    }
}
interface LoaderProps<T> {
    text?: string;
    bold?: boolean
    promise: Promise<T>;
    children: (data?: T, error?: any) => React.ReactNode;
}
interface LoaderState<T> {
    lastRendered?: React.ReactNode;
}