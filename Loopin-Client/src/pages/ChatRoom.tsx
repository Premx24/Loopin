import { useEffect, useRef, useState } from "react";
import Button from "../components/Button";
import ChatDoubleIcon from "../icons/ChatDoubleIcon";
import ChatMessage from "../components/ChatMessage";

interface chatProp {
    chat: string
}

// @ts-ignore
export default function ChatRoom({socket, isConnected, roomCode}){
    const chatRef = useRef<HTMLInputElement | null>(null)
    //  dont keep any in ts, it's bad!! change it later!
    const [message, setMessage] = useState<chatProp[]>([])

    useEffect(()=>{

        // Now event.data receives entire backend req body
        if(!socket.current) return

        // @ts-ignore
        socket.current.onmessage=(event)=>{
            const data = JSON.parse(event.data)
            setMessage(prev => [
                ...prev,
                {
                    chat: data.message,
                }
            ])
            console.log(event)
        }

        
    }, [isConnected])

    return (
        <>
        <div className="flex flex-col min-h-screen bg-black justify-center items-center pb-50 text-white">
            <div className="flex flex-col justify-top border border-gray-600 p-5 rounded-lg m-5 pt-10 w-200 h-250">
                <div className="flex text-3xl gap-2 left-0 items-center pl-10">
                    <ChatDoubleIcon/> Real Time Chat
                </div>
                <div className="text-lg text-neutral-400 px-10">
                    Temporary room that expires after both users exit
                </div>
                <div className="bg-neutral-800 text-neutral-300 p-3 mx-10 my-7 rounded-md">
                    {`Room Code: ${roomCode}`} 
                </div>
                <div className="flex flex-col gap-3 px-10 overflow-y-auto">
                    {message.map(x => {
                        return <ChatMessage message={x.chat}/>
                    })}
                </div>
                <div className="flex pl-10 mt-auto">
                    <input type="text" ref={chatRef} placeholder=" Type a message..." className="text-white border border-gray-300 rounded-md text-center w-200 mr-5 pl-5 text-left"/>
                    <div onClick={()=>{
                        socket.current?.send(JSON.stringify({
                            "type": "chat",
                            "RoomId": roomCode,
                            "message": chatRef.current?.value
                            }
                        ))
                        if(chatRef.current){
                            chatRef.current.value = ""
                        }
                    }}>
                        <Button text="send" size="sm"/>
                    </div>
                </div>
            </div>
        </div>
        </>
    )
}