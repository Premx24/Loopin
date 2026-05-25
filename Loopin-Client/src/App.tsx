import { useEffect, useRef, useState } from "react";
import ChatRoom from "./pages/ChatRoom";
import LandingPage from "./pages/LandingPage";
import { generateCode } from "./utils";

// Later implement useSocket or React Context

export default function App() {
    const socketRef = useRef<WebSocket | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [inChatRoom, setChatRoom] = useState(false)
    const [roomCode] = useState(()=> generateCode())

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
      {
        !inChatRoom ? <LandingPage socket={socketRef} setChatRoom={setChatRoom} roomCode={roomCode}/> : <ChatRoom socket={socketRef} isConnected={isConnected} roomCode={roomCode}/>
      }
    </>
  )
}
