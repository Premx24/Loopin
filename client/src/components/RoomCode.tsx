// Room Code component
interface chatMessageProps {
    message: string
}

export default function RoomCode({message}:chatMessageProps){

    return (
        <div className="bg-neutral-500 text-black rounded p-3 text-xl w-150 h-15 font-semibold">
            {message} 
        </div>
    )
}