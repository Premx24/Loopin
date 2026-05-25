interface chatMessageProps {
    message: string
    isOwner: boolean
}

export default function ChatMessage({message, isOwner}:chatMessageProps){
    // If isOwner then chat is rendered in end or in start
    return (
        <div className={`bg-white text-black rounded p-3 text-lg w-fit max-w-[60%] break-words ${isOwner ? "self-end" : "self-start"}`}>
            {message}
        </div>
    )
}