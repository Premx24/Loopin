import { WebSocketServer, WebSocket } from "ws";

const ws = new WebSocketServer({port:8080})

interface chatInterface {
    [RoomId: string]: WebSocket[]
}

const chatRooms: chatInterface = {
    "red12": [],
}

// Message body - {
//     "type": "join"/"create"/"chat",
//     "RoomId": "",
//     "message": ""
// }


ws.on("connection", function(socket){
    
    socket.on("message", (msg)=>{

        console.log(msg.toString())
        const parsedMsg = JSON.parse(msg.toString())
        console.log("Parsed Message: " + parsedMsg)

        // User Joins a room and if exists then add it to that room otherwise return Room doesn't exist
        if(parsedMsg.type == "join"){
            !chatRooms[parsedMsg.RoomId] ? console.log("Room Doesn't Exist") : chatRooms[parsedMsg.RoomId]?.push(socket)
            console.log(chatRooms[parsedMsg.RoomId]?.length)
        } 
        // User creates a room - loophole: If that room already exists then user is directly added to that room, will change that later
        else if(parsedMsg.type == "create"){
            !chatRooms[parsedMsg.RoomId] ? chatRooms[parsedMsg.RoomId]=[] : console.log("Room Already Exists")
            console.log(chatRooms[parsedMsg.RoomId]?.length)
        }
        // User wants to chat then first we check if that user is part of that room or not and if yes then forward that chat to everyone in that room
        else if(parsedMsg.type == "chat" && chatRooms[parsedMsg.RoomId]?.includes(socket)){
            chatRooms[parsedMsg.RoomId]?.forEach(socket => {
                socket.send(JSON.stringify(parsedMsg))
            })
        }
        // For every-other case, we just send a message - "Error Occured"
        else{
            socket.send("Error Occured!")
        }
    })
})

// Used Map and set instead of array in json :-

// const chatRooms = new Map<string, Set<WebSocket>>()

// ws.on("connection", function(socket){
    
//     socket.on("message", (msg)=>{

//         const parsedMsg = JSON.parse(msg.toString())
//         console.log(parsedMsg)
//         if(parsedMsg.type == "create" && !chatRooms.has(parsedMsg.RoomId)){
//             chatRooms.set(parsedMsg.RoomId, new Set())
//             chatRooms.get(parsedMsg.RoomId)?.add(socket)
//             console.log(chatRooms)
//         }

//     })

// })

