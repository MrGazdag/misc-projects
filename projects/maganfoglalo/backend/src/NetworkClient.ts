import WebSocket from "ws";
export default class NetworkClient {
    private socket: WebSocket;
    private packetHandler: PacketHandler;
    private timeout!: NodeJS.Timeout;

    private disconnected: boolean;
    private disconnectHandler: ()=>void;
    constructor(socket: WebSocket, handler: PacketHandler) {
        this.socket = socket;
        this.packetHandler = handler;
        this.refreshTimeout();

        this.socket.onmessage = (event) => {
            this.refreshTimeout();
            try {
                let data = JSON.parse(event.data as string);
                this.packetHandler(data);
            } catch (e) {
                console.error("Invalid packet received: ", e);
                this.disconnect();
            }
        };
        this.socket.onclose = ()=>{
            if (this.disconnected) return;

            this.disconnected = true;
            this.disconnectHandler();
        }

        this.disconnected = false;
        this.disconnectHandler = ()=>{};
    }

    setDisconnectHandler(handler: ()=>void) {
        this.disconnectHandler = handler;
    }

    refreshTimeout() {
        if (this.timeout) clearTimeout(this.timeout);
        this.timeout = setTimeout(()=>{
            this.disconnect();
        }, 10_000);
    }

    sendPacket(packet: any) {
        this.socket.send(JSON.stringify(packet));
    }

    disconnect() {
        this.socket.close();
    }

    setHandler(handler: PacketHandler) {
        this.packetHandler = handler;
    }
}
type PacketHandler = (data: any) => void;