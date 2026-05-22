import { WebSocketServer, WebSocket } from "ws";

const ws = new WebSocketServer({port:8080})

interface chatInterface {
    [RoomId: string]: WebSocket[]
}

const chatRooms: chatInterface = {
    "red12": [],
}

ws.on("connection", function(socket, req){
    
    socket.on("message", (msg)=>{
        const parsedMsg = JSON.parse(msg.toString())
        console.log(parsedMsg)
        if(parsedMsg.type == "join"){
            if(!chatRooms[parsedMsg.RoomId]){
                chatRooms[parsedMsg.RoomId] = []
            }
            chatRooms[parsedMsg.RoomId]?.push(socket)
            console.log(chatRooms[parsedMsg.RoomId]?.length)
        } else{
            chatRooms[parsedMsg.RoomId]?.forEach(x => {
                x.send(parsedMsg.chat)
            })
        }
    })
})

