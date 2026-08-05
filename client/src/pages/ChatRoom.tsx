import { useEffect, useRef, useState } from "react";
import ChatMessage from "../components/ChatMessage";
import toast, {Toaster} from "react-hot-toast";
import VideoIcon from "../icons/VideoIcon";
import VideoCancel from "../icons/VideoCancel";
import MicIcon from "../icons/MicIcon";
import MicOff from "../icons/MicOffIcon";
import ProfileIcon from "../icons/ProfileIcon";
import ChatDoubleIcon from "../icons/ChatDoubleIcon";

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
    const [isChatOpen, setIsChatOpen] = useState(false)
    const [isMicOn, setIsMicOn] = useState(false)
    const [isCameraOn, setIsCameraOn] = useState(false)

    const localStreamRef = useRef<HTMLVideoElement|null>(null)
    const peerConnectionRef = useRef<RTCPeerConnection|null>(null)
    const remoteStreamRef = useRef<HTMLVideoElement|null>(null)

    useEffect(()=>{

        const stunUrl = import.meta.env.VITE_STUN_URL || "stun:stun.l.google.com:19302"
        const turnUrlsRaw = import.meta.env.VITE_TURN_URLS || "turn:openrelay.metered.ca:443?transport=tcp,turn:openrelay.metered.ca:443?transport=udp"
        const turnUrls = turnUrlsRaw
            .split(",")
            .map((url: string) => url.trim())
            .filter(Boolean)
        const turnUsername = import.meta.env.VITE_TURN_USERNAME || "openrelayproject"
        const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL || "openrelayproject"

        peerConnectionRef.current = new RTCPeerConnection({
            iceServers: [
                { urls: [stunUrl] },
                {
                    urls: turnUrls,
                    username: turnUsername,
                    credential: turnCredential,
                }
            ]
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
        if(!localStream) return

        localStream.getAudioTracks().forEach((track)=>{
            track.enabled = isMicOn
        })
    }, [isMicOn, localStream])

    useEffect(()=>{
        if(!localStream) return

        const videoTracks = localStream.getVideoTracks()
        if(isCameraOn){
            if(videoTracks.length === 0){
                const addVideoTrack = async()=>{
                    try {
                        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true })
                        const [videoTrack] = videoStream.getVideoTracks()
                        if(videoTrack){
                            localStream.addTrack(videoTrack)
                            peerConnectionRef.current?.addTrack(videoTrack, localStream)
                        }
                    } catch (error) {
                        console.error("Unable to access camera:", error)
                    }
                }
                addVideoTrack()
            } else {
                videoTracks.forEach((track)=>{
                    track.enabled = true
                })
            }
        } else {
            videoTracks.forEach((track)=>{
                track.enabled = false
            })
        }
    }, [isCameraOn, localStream])

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
                audio: true,
                video: isCameraOn
            })
            setLocalStream(localMedia)

            localMedia?.getAudioTracks().forEach((track)=>{
                track.enabled = isMicOn
                peerConnectionRef.current!.addTrack(track, localMedia)
            })

            localMedia?.getVideoTracks().forEach((track)=>{
                track.enabled = isCameraOn
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
            <Toaster />
            <div className="min-h-screen w-screen bg-slate-950 text-slate-100">
                <div className="mx-auto flex min-h-screen max-w-[1700px] flex-col px-4 py-5 transition-all duration-500">
                    <div className="flex flex-1 flex-col gap-5 transition-all duration-500 xl:flex-row xl:items-stretch xl:gap-6">
                        <div className={`flex min-h-[calc(100vh-180px)] flex-1 flex-col gap-5 transition-all duration-500 ${isChatOpen ? 'xl:basis-[calc(100%-420px)]' : ''}`}>
                            <div className="grid flex-1 gap-5 lg:grid-cols-2">
                                <div
                                    className="group relative overflow-hidden rounded-[32px] border border-slate-700/70 bg-slate-900/70 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.9)] transition-all duration-500"
                                >
                                    <div className="absolute inset-0 flex items-center justify-center z-10">
                                        {!localStream && <ProfileIcon/>}
                                    </div>
                                    <video ref={localStreamRef} muted={true} autoPlay playsInline className="h-full w-full min-h-[340px] object-cover" />
                                </div>

                                <div className="group relative overflow-hidden rounded-[32px] border border-slate-700/70 bg-slate-900/70 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.9)] transition-all duration-500">
                                    <div className="absolute inset-0 flex items-center justify-center z-10">
                                        {!remoteStream && <ProfileIcon/>}
                                    </div>
                                    <video ref={remoteStreamRef} muted={false} autoPlay playsInline className="h-full w-full min-h-[340px] object-cover" />
                                </div>
                            </div>
                        </div>

                        <div className={`relative flex shrink-0 transition-[width,opacity] duration-500 ${isChatOpen ? 'w-full max-w-[420px] opacity-100' : 'w-0 opacity-0'}`}>
                            <aside className="flex h-full w-full flex-col overflow-hidden rounded-[32px] border border-slate-700/70 bg-slate-900/80 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.9)] backdrop-blur-xl transition-all duration-500">
                                <div className="border-b border-slate-700/60 px-5 py-4">
                                    <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">Chat</h2>
                                </div>
                                <div className="flex-1 flex flex-col space-y-3 overflow-y-auto px-5 py-4 justify-end">
                                    {message.length ? message.map((x, index) => (
                                        <ChatMessage key={index} message={x.chat} isOwner={x.isOwner} />
                                    )) : (
                                        <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-700/50 bg-slate-950/60 p-6 text-sm text-slate-500">
                                            No messages yet.
                                        </div>
                                    )}
                                </div>
                                <div className="border-t border-slate-700/60 px-5 py-4">
                                    <div className="flex items-center gap-3 rounded-3xl border border-slate-700/70 bg-slate-950/80 px-3 py-3">
                                        <input
                                            id="chat"
                                            type="text"
                                            ref={chatRef}
                                            placeholder="Type a message..."
                                            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                                        />
                                        <button
                                            onClick={() => {
                                                if(chatRef.current?.value){
                                                    socket.current?.send(JSON.stringify({
                                                        type: "chat",
                                                        RoomId: roomCode,
                                                        message: chatRef.current?.value,
                                                        isOwner: false
                                                    }))
                                                    chatRef.current.value = ""
                                                } else {
                                                    toast.error("Message cannot be empty!")
                                                }
                                            }}
                                            className="rounded-2xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 cursor-pointer"
                                        >
                                            Send
                                        </button>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    </div>
                </div>

                <div className="pointer-events-none fixed inset-x-0 bottom-6 z-20 flex justify-center px-4">
                    <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-slate-700/70 bg-slate-950/90 px-4 py-3 shadow-2xl shadow-slate-950/40 backdrop-blur-xl transition-all duration-500">
                        <button
                            onClick={() => {
                                if(!isCalling){
                                    setIsCalling(true)
                                }
                                setIsMicOn(prev => !prev)
                            }}
                            className={`inline-flex items-center justify-center rounded-full border px-3 py-3 transition ${isMicOn ? 'border-cyan-500 bg-cyan-500/20 text-white' : 'border-slate-700 bg-slate-900 text-slate-400'}`}
                        >
                            {isMicOn ? <MicIcon/> : <MicOff/>}
                        </button>
                        <button
                            onClick={() => {
                                if(!isCalling){
                                    setIsCameraOn(true)
                                    setIsCalling(true)
                                } else {
                                    setIsCameraOn(prev => !prev)
                                }
                            }}
                            className={`inline-flex items-center justify-center rounded-full border px-3 py-3 transition ${isCameraOn ? 'border-cyan-500 bg-cyan-500/20 text-white' : 'border-slate-700 bg-slate-900 text-slate-400'}`}
                        >
                            {isCameraOn ? <VideoIcon/> : <VideoCancel/>}
                        </button>
                        <button
                            onClick={() => setIsChatOpen(prev => !prev)}
                            className={`inline-flex items-center justify-center rounded-full border px-3 py-3 transition ${isChatOpen ? 'border-cyan-500 bg-cyan-500/20 text-white' : 'border-slate-700 bg-slate-900 text-slate-400'}`}
                        >
                            <ChatDoubleIcon />
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}