// Room Code component
interface chatMessageProps {
    message: string
}

export default function RoomCode({message}:chatMessageProps){

    return (
        <div className="rounded-2xl border border-cyan-400/30 bg-slate-900/80 px-4 py-3 text-base font-semibold text-cyan-200 shadow-lg shadow-cyan-500/10">
            {message}
        </div>
    )
}