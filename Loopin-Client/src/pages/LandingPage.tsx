import { useRef, useState } from "react";
import Button from "../components/Button";
import ChatIcon from "../icons/ChatIcon";
import RoomCode from "../components/RoomCode";

// @ts-ignore
export default function LandingPage({socket, setChatRoom, roomCode}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [roomCreated, setRoom] = useState(false)

  return (
    <>
    <div className="flex flex-col min-h-screen bg-black justify-center items-center pb-50 text-white">
      <div className="flex flex-col justify-center border border-gray-600 p-5 rounded-lg m-5 pt-10">
        <div className="flex text-3xl gap-2 left-0 items-center pl-10">
          <ChatIcon/> Real Time Chat
        </div>
      <div className="text-lg text-slate-400 pl-10">
        Temporary room that expires after both users exit
      </div>
      <div className="flex items-center justify-center pt-8" onClick={()=>{
        socket.current?.send(JSON.stringify({
              "type": "create",
              "RoomId": roomCode,
            }
          ))
          console.log("Room created in client side")
          setRoom(true)
      }}>
        <Button text="Create New Room" size="lg"/>
      </div>
      <div className="flex m-10">
        <input type="text" ref={inputRef} placeholder="Enter Room Code" className="text-white border border-gray-300 rounded-md text-center pr-40 mr-5"/>
        <div onClick={()=>{
          socket.current.send(JSON.stringify({
              "type": "join",
              "RoomId": inputRef.current?.value,
            }
          ))
          setChatRoom(true)
        }}>
          <Button text="Join Room" size="sm"/>
        </div>
      </div>
      {
        roomCreated && (
          <div className="ml-10">
            <RoomCode message={`Room Code: ${roomCode}`}/>
          </div>
        )
      }
      </div>
    </div>
    </>
  )
}
