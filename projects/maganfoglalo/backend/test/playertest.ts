import * as readline from "node:readline";

(async ()=>{
    let ws = new WebSocket("ws://localhost:4000/ws");
    ws.onmessage = e=>console.log(e.data);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: "> ",
    });

    rl.prompt();

    rl.on("line", (line) => {
        if (!line) {
            console.log("empty line");
            return rl.prompt();
        }
        try {
            JSON.parse(line);
        } catch (e) {
            console.error(e);
            return rl.prompt();
        }

        ws.send(line);

        rl.prompt();
    });
})();