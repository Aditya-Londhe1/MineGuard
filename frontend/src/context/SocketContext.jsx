import { createContext, useContext, useEffect, useRef, useState } from "react"
import { createWebSocket } from "../services/websocket"

const SocketContext = createContext({
  connected: false,
  subscribe: () => () => {},
})

export function SocketProvider({ children }) {

  const [connected, setConnected] = useState(false)
  const listenersRef = useRef(new Set())

  useEffect(() => {

    const socket = createWebSocket(
      (event) => {
        listenersRef.current.forEach(listener => listener(event))
      },
      setConnected
    )

    return () => {
      socket.close()
    }

  }, [])

  const subscribe = (listener) => {
    listenersRef.current.add(listener)
    return () => listenersRef.current.delete(listener)
  }

  return (
    <SocketContext.Provider value={{ connected, subscribe }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}
