import { useEffect, useRef, useState } from "react";
import ChatRoom from "./pages/ChatRoom";
import LandingPage from "./pages/LandingPage";
import { generateCode } from "./utils";
import toast from "react-hot-toast";

// Later implement useSocket or React Context

export default function App() {
    const socketRef = useRef<WebSocket | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [inChatRoom, setChatRoom] = useState(false)
    const [roomCode, setRoomCode] = useState(generateCode())

    useEffect(()=>{
      const socket = new WebSocket("ws://localhost:8080")
      socketRef.current = socket
      socket.onopen=()=>{
          console.log("workss")
          setIsConnected(true)
      }


      socket.onerror=()=>{
          console.log(toast.error("Error Occured"))
      }
    },[])

  return (
    <>
      {
        !inChatRoom ? <LandingPage socket={socketRef} setChatRoom={setChatRoom} setRoomCode={setRoomCode} roomCode={roomCode} isConnected={isConnected}/> : <ChatRoom socket={socketRef} isConnected={isConnected} roomCode={roomCode}/>
      }
    </>
  )
}
