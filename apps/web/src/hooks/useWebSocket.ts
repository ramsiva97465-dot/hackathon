import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:3001'

let globalSocket: Socket | null = null

function getSocket(): Socket {
  if (!globalSocket) {
    globalSocket = io(WS_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 5,
    })
  }
  return globalSocket
}

export function useWebSocket<T = unknown>(
  event: string,
  handler: (data: T) => void
) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    const socket = getSocket()
    const fn = (data: T) => handlerRef.current(data)
    socket.on(event, fn)
    return () => { socket.off(event, fn) }
  }, [event])

  const emit = useCallback((emitEvent: string, data?: unknown) => {
    getSocket().emit(emitEvent, data)
  }, [])

  return { emit }
}

export function disconnectSocket() {
  globalSocket?.disconnect()
  globalSocket = null
}
