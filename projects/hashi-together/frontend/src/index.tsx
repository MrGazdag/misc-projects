// Render with React
import {StrictMode} from "react";
import App from "./App";
import {createRoot} from "react-dom/client";
import React from "react";
import HashiRenderer from "./api/HashiRenderer";
import HashiMap from "../../common/HashiMap";

//let map = new HashiMap(7, [0,4,0,0,3,0,2,2,0,1,0,0,0,0,0,2,0,0,0,0,0,5,0,3,0,4,0,2,0,0,0,0,0,0,0,0,0,0,0,4,0,2,4,0,2,0,0,0,0]);
let mapData = {
        mapSize: 10,
        states: [
                8, -3, -3, -3,  8, -4, -4, 8, -3,  8, -2,  0,
                0,  0, -1,  8, -3,  8, -3, 8,  8, -4,  8,  0,
                -1,  0,  0, -1,  0,  0, -1, 8, -4, -4,  8, -3,
                -3,  8, -3,  8, -1, -2,  0, 0, -2,  0,  0,  0,
                0, -2, -1, -2,  0,  0, -2, 0,  0,  0,  0,  8,
                -1,  8,  0,  0, -2,  0,  0, 0,  0,  0,  8, -3,
                8,  0, -2,  0,  0,  0,  0, 0,  8, -4, -4, -4,
                8, -4, -4, -4, -4,  8,  0, 0,  0,  0,  0,  0,
                0,  0,  0,  0
        ]
};
let map = new HashiMap(mapData);
let renderer = new HashiRenderer(map);

const root = createRoot(document.getElementById("root")!);
root.render(
    <StrictMode>
        <App renderer={renderer} />
    </StrictMode>
);