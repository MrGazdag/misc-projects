import {createRoot} from "react-dom/client";
import React, {StrictMode} from "react";
import App from "./ui/App";
import MaganFoglalo from "./api/MaganFoglalo";

let api = new MaganFoglalo();
(window as any)["api"] = api;

const root = createRoot(document.getElementById("root")!);
root.render(
    <StrictMode>
        <App api={api}/>
    </StrictMode>
);