import Button from "../components/Button";
import ChatMessage from "../components/ChatMessage";
import ChatDoubleIcon from "../icons/ChatDoubleIcon";

export default function ChatRoom(){
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
                <div className="bg-neutral-800 text-neutral-300 p-3 mx-10 my-7">
                    Room Code: Red
                </div>
                <div className="flex pl-10 mt-auto">
                    <input type="text" placeholder=" Type a message..." className="text-white border border-gray-300 rounded-md text-center w-200 mr-5 text-left"/>
                    <Button text="send" size="sm"/> 
                </div>
            </div>
        </div>
        </>
    )
}