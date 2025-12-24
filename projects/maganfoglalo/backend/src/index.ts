import express from 'express';
import * as http from "node:http";
import {WebSocketServer} from "ws";
import cors from "cors";
import MaganfoglaloBackend from "./MaganfoglaloBackend";


const PORT = 80;

let backend = new MaganfoglaloBackend();
(window as any).backend = backend;

const app = express();
app.use(express.json());
app.use(cors());

app.get("/create_lobby", (req, res) => {
    let lobby = backend.createLobby();
    res.send(lobby.getKey());
});


const server = http.createServer(app);

const wss = new WebSocketServer({
    server: server,
    path: "/ws",
});
wss.on("connection", (ws,req) => {
    backend.handleClient(ws);
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});