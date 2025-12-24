export type PacketLike = {
    type: string
}
export type Packet<T extends PacketLike> = {
  [K in T["type"]]: T
};