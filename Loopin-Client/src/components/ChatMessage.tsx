interface chatMessageProps {
    message: string
}

export default function ChatMessage({message}:chatMessageProps){
    return (
        <div className="bg-white text-black rounded p-3 text-lg w-fit max-w-[60%] break-words">
            {message}
        </div>
    )
}