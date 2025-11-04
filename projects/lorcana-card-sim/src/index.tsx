// Render with React
import {StrictMode} from "react";
import App from "./App";
import {createRoot} from "react-dom/client";
import React from "react";
import LorcanaApi from "./api/LorcanaApi";
import Loader from "../../../common/Loader";

(async ()=>{
    let api = new LorcanaApi();
    (window as any)["api"] = api;

    const root = createRoot(document.getElementById("root")!);
    root.render(
        <StrictMode>
            <Loader text={"Loading Lorcana cards..."} promise={api.getApiCards()}>
                {()=>{
                    api.setExtraCards(`[{
    "Image": "https://cdn.dreamborn.ink/images/en/cards/010/6405ce4a96abee3111b1e53c28e11fab0d00e8e3",
    "Name": "Spooky Sight"
  },
{
    "Image": "https://cdn.dreamborn.ink/images/en/cards/010/8d6df8732abe1c376c007171fd4fce0eb5a02ed3",
    "Name": "He Hurled His Thunderbolt"
  },
{
    "Image": "https://cdn.dreamborn.ink/images/en/cards/010/3a5ef78547ed2f6954cb32d88295da8940f8f03e",
    "Name": "Goliath - Clan Leader"
  },
{
    "Image": "https://cdn.dreamborn.ink/images/en/cards/010/cc2a8eec3d007ff60083ce48c2a26394ec7b6253",
    "Name": "Cinderella - Dream Come True"
  }]`)
                    api.parseDeck(`4 Captain Hook - Forceful Duelist
4 Mulan - Disguised Soldier
4 Sail The Azurite Sea
4 Tipo - Growing Son
4 Cinderella - Dream Come True
2 Spooky Sight
4 Hades - Infernal Schemer
4 Robin Hood - Unrivaled Archer
4 Goliath - Clan Leader
4 Jasmine - Fearless Princess
4 Namaari - Single-Minded Rival
4 Vincenzo Santorini - The Explosives Expert
4 He Hurled His Thunderbolt
4 Strength of a Raging Fire
1 Mufasa - Ruler of Pride Rock
3 Vision of the Future
2 Beyond the Horizon`);
                    return <App api={api}/>;
                }}
            </Loader>
        </StrictMode>
    );
})();