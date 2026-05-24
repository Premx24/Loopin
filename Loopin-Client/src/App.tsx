import { useEffect, useRef, useState } from "react";
import ChatRoom from "./pages/ChatRoom";
import LandingPage from "./pages/LandingPage";

// Later implement useSocket or React Context

export default function App() {
    const socketRef = useRef<WebSocket | null>(null)
    const [isConnected, setIsConnected] = useState(false)

    useEffect(()=>{
      const socket = new WebSocket("ws://localhost:8080")
      socketRef.current = socket
      socket.onopen=()=>{
          console.log("workss")
          setIsConnected(true)
      }

      socket.onmessage=(event)=>{
          console.log(event.data)
      }

      socket.onerror=()=>{
          console.log("erorr occured")
      }
    },[])

  return (
    <>
      <LandingPage socket={socketRef}/>
      <ChatRoom socket={socketRef} isConnected={isConnected}/>
    </>
  )
}
