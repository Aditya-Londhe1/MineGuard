const WS_URL =
  import.meta.env.VITE_WS_URL || "ws://127.0.0.1:8000/ws"


export function createWebSocket(onMessage, onStatusChange) {
  let socket = null
  let reconnectTimer = null
  let shouldReconnect = true

  const connect = () => {
    socket = new WebSocket(WS_URL)

    socket.onopen = () => {
      console.log("MineGuard WebSocket connected")
      onStatusChange?.(true)
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
    }

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onMessage(data)
      } catch (error) {
        console.error("Invalid WebSocket message:", error)
      }
    }

    socket.onerror = (error) => {
      console.error("MineGuard WebSocket error:", error)
      onStatusChange?.(false)
    }

    socket.onclose = () => {
      console.log("MineGuard WebSocket disconnected")
      onStatusChange?.(false)

      if (shouldReconnect) {
        reconnectTimer = setTimeout(() => {
          connect()
        }, 2000)
      }
    }
  }

  connect()

  return {
    close: () => {
      shouldReconnect = false
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
      socket?.close()
    },
    send: data => socket?.send(data),
  }
}