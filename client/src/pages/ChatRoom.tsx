import { useEffect, useRef, useState } from "react";
import Button from "../components/Button";
import ChatDoubleIcon from "../icons/ChatDoubleIcon";
import ChatMessage from "../components/ChatMessage";
import toast, {Toaster} from "react-hot-toast";
import VideoIcon from "../icons/VideoIcon";
import VideoCancel from "../icons/VideoCancel";

interface chatProp {
    chat: string,
    isOwner: boolean
}

// @ts-ignore
export default function ChatRoom({socket, isConnected, roomCode}){

    // Webrtc code
    const [localStream, setLocalStream] = useState<MediaStream | null>(null)
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
    const [isCalling, setIsCalling] = useState(false)

    const localStreamRef = useRef<HTMLVideoElement|null>(null)
    const peerConnectionRef = useRef<RTCPeerConnection|null>(null)
    const remoteStreamRef = useRef<HTMLVideoElement|null>(null)

    useEffect(()=>{

        peerConnectionRef.current = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        })

        peerConnectionRef.current!.onicecandidate = (event)=>{
            if(event.candidate){
                socket.current?.send(JSON.stringify({
                    type: "ice-candidate",
                    RoomId: roomCode,
                    candidate: event.candidate
                })
            )}
        }

        peerConnectionRef.current!.ontrack=(event)=>{
            const [stream] = event.streams
            setRemoteStream(stream)
            if(remoteStreamRef.current){
                remoteStreamRef.current.srcObject = stream
            }
        }

    }, [])

    useEffect(()=>{
        if(localStreamRef.current && localStream){
            localStreamRef.current.srcObject = localStream
        }
    }, [localStream])

    useEffect(()=>{

        const createOffer = async()=>{
            const offer = await peerConnectionRef.current?.createOffer()

            await peerConnectionRef.current?.setLocalDescription(offer)
        
            socket.current?.send(JSON.stringify({
                type: "offer",
                RoomId: roomCode,
                offer: offer,
                from: "User A"
            }))
        }

        const getlocalMedia = async()=>{
            const localMedia = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            })
            setLocalStream(localMedia)

            localMedia?.getTracks().forEach((track)=>{
                peerConnectionRef.current!.addTrack(track, localMedia)
            })

            createOffer()
        }

        if(isCalling){
            getlocalMedia()
        }
        else{
            localStream?.getTracks().forEach((tracks)=>{
                tracks.stop()
            })
            setLocalStream(null)

            if(localStreamRef.current){
                localStreamRef.current.srcObject=null
            }
        }

    }, [isCalling])

    const chatRef = useRef<HTMLInputElement | null>(null)
    //  dont keep any in ts, it's bad!! change it later!
    const [message, setMessage] = useState<chatProp[]>([])
    console.log(roomCode)
    useEffect(()=>{

        // Now event.data receives entire backend req body
        if(!socket.current) return

        // @ts-ignore
        socket.current.onmessage = async(event)=>{
            const data = JSON.parse(event.data)
            if(data.type=="chat"){
                setMessage(prev => [
                    ...prev,
                    {
                        chat: data.message,
                        isOwner: data.isOwner
                    }
                ])
                console.log(event)
            }

            if(data.type == "offer"){
                await peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(data.offer))

                localStream?.getTracks().forEach((tracks)=>{
                    peerConnectionRef.current?.addTrack(tracks, localStream)
                })

                const answer = await peerConnectionRef.current?.createAnswer()

                await peerConnectionRef.current?.setLocalDescription(answer)

                socket.current.send(JSON.stringify({
                    type: "answer",
                    RoomId: roomCode,
                    answer: answer,
                    from: "User B"
                }))
            }

            if(data.type == "answer"){
                await peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(data.answer))
            }

            if(data.candidate){
                await peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(data.candidate))
            }
        }

        
    }, [isConnected])

    return (
        <>
        <Toaster/>
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_35%),linear-gradient(135deg,_#020617_0%,_#111827_45%,_#0f172a_100%)] px-4 py-6 text-white sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-6xl flex-col rounded-[28px] border border-slate-700/70 bg-slate-950/80 p-4 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl sm:p-6 lg:p-8">
                <div className="flex flex-col gap-3 rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div>
                        <div className="flex items-center gap-2 text-2xl font-semibold sm:text-3xl">
                            <ChatDoubleIcon/> Real Time Chat
                        </div>
                        <div className="mt-2 text-sm text-slate-400 sm:text-base">
                            Temporary room that expires after both users exit
                        </div>
                    </div>
                </div>

                <div className="mt-5 rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-300">
                            {`Room Code: ${roomCode}`}
                        </div>
                        <div className="flex mr-5 cursor" onClick={()=>{
                            setIsCalling(!isCalling)
                        }}>
                            {isCalling ? <VideoIcon/> : <VideoCancel/>}
                        </div>
                    </div>

                    <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-3 sm:p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white">Video call</h3>
                            </div>
                            <div className="grid gap-3">
                                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70">
                                    <div className="aspect-video bg-gradient-to-br from-slate-800 via-slate-900 to-black">
                                        {localStream ? (
                                            <video ref={localStreamRef} autoPlay muted playsInline className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-sm text-slate-500">
                                                Camera preview will appear here once access is granted.
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70">
                                    <div className="aspect-video bg-gradient-to-br from-slate-800 via-slate-900 to-black">
                                        {remoteStream ? (
                                            <video ref={remoteStreamRef} autoPlay playsInline className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-sm text-slate-500">
                                                Your peer video will show up once the WebRTC connection is established.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex min-h-[420px] flex-col rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white">Chat</h3>
                            </div>
                            <div className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/70 p-3 [scrollbar-width:none] [-ms-overflow-style:none]">
                                {message.map((x, index) => {
                                    return <ChatMessage key={index} message={x.chat} isOwner={x.isOwner} />
                                })}
                            </div>
                            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                                <input type="text" ref={chatRef} placeholder="Type a message..." className="flex-1 rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"/>
                                <div onClick={()=>{
                                    if(chatRef.current?.value){
                                        socket.current?.send(JSON.stringify({
                                        "type": "chat",
                                        "RoomId": roomCode,
                                        "message": chatRef.current?.value,
                                        "isOwner": false
                                        }))
                                        chatRef.current.value = ""
                                    } else{
                                        toast.error("Message cannot be empty!")
                                    }
                                }}>
                                    <Button text="Send" size="sm"/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    )
}