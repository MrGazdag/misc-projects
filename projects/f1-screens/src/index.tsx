import {createRoot} from "react-dom/client";
import React, {StrictMode} from "react";
import App from "./App";
import F1Renderer from "./api/F1Renderer";
import Formula1Regular from "./fonts/Formula1-Regular.otf";
import Formula1Bold from "./fonts/Formula1-Bold_mod.otf";
import TextRenderer from "./api/TextRenderer";
import gameData from "./game_data_season1.json";
(async ()=>{
    let fonts: FontFace[] = [
        new FontFace("Formula1", "url(" + Formula1Regular +")", {weight: "normal"}),
        new FontFace("Formula1", "url(" + Formula1Bold +")", {weight: "bold"})
    ];
    await Promise.all(fonts.map(f=>f.load().then(()=>{
        document.fonts.add(f);
        console.log("Font loaded: ", f);
    })));
    (window as any)["TextRenderer"] = TextRenderer;

    let rawGameData = JSON.stringify(gameData as any, null, 4);

    let f1 = new F1Renderer(rawGameData);
    await f1.getGameData().init();
    const root = createRoot(document.getElementById("root")!);
    root.render(
        <StrictMode>
            <App app={f1}/>
        </StrictMode>
    );
})();