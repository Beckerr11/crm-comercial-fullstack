import { io } from "socket.io-client"
import { SOCKET_URL } from "../config"

export function createSocketClient(token) {
  return io(SOCKET_URL, {
    autoConnect: true,
    auth: { token },
    transports: ["websocket", "polling"],
  })
}
