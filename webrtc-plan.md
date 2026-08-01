## WebRTC plan for your current app

Your current app is a good fit for WebRTC because you already have:
- a room-based chat flow,
- a WebSocket server,
- and a simple React UI.

The cleanest approach is:

- keep WebSockets for chat and signaling,
- use WebRTC for the actual audio/video data path.

That means your server will not carry the video stream itself; it will only forward offer/answer/ICE messages between the two users.

> Hint: your current server implementation only forwards chat/join/create messages. It must also forward `offer`, `answer`, and `ice-candidate` messages so the remote video can connect.
>
> Example server forwarding:
> ```ts
> else if (["offer", "answer", "ice-candidate"].includes(parsedMsg.type)) {
>   chatRooms[parsedMsg.RoomId]?.forEach(peer => {
>     if (peer !== socket) {
>       peer.send(JSON.stringify(parsedMsg))
>     }
>   })
> }
> ```
>
> Example client signaling send/receive:
> ```ts
> socket.current?.send(JSON.stringify({
>   type: "offer",
>   roomId: roomCode,
>   offer,
> }))
>
> if (data.type === "offer") {
>   await pc.setRemoteDescription(new RTCSessionDescription(data.offer))
>   const answer = await pc.createAnswer()
>   await pc.setLocalDescription(answer)
>   socket.current?.send(JSON.stringify({ type: "answer", roomId: roomCode, answer }))
> }
> if (data.type === "ice-candidate") {
>   await pc.addIceCandidate(new RTCIceCandidate(data.candidate))
> }
> ```
>
> Also add `autoPlay`/`muted` to your `<video>` tags so the browser starts the local preview automatically.

---

## Recommended architecture

### What stays the same
- WebSocket handles:
  - chat messages
  - join/create room
  - WebRTC signaling messages

### What gets added
- browser media capture via getUserMedia
- RTCPeerConnection
- local and remote video elements
- call start / accept / end UI

---

## Step-by-step implementation plan

### 1. First, understand the current flow
Your app already has these main pieces:

- client/src/App.tsx
- client/src/pages/LandingPage.tsx
- client/src/pages/ChatRoom.tsx
- server/src/index.ts

For the first version, implement one-to-one video calls inside one chat room.

---

### 2. Add a simple call state in the chat page
In the chat room component, add state like this:

```ts
const [localStream, setLocalStream] = useState<MediaStream | null>(null)
const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
const [isCalling, setIsCalling] = useState(false)
const [isInCall, setIsInCall] = useState(false)
const [callStatus, setCallStatus] = useState("idle")
```

You will also want refs for:

```ts
const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
const localVideoRef = useRef<HTMLVideoElement | null>(null)
const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
```

This keeps the UI logic simple and gives you a place to store the WebRTC connection.

---

### 3. Add media access first
Before doing signaling, make sure the browser can capture video/audio.

Use:

```ts
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
})
```

When it succeeds:
- save the stream to state
- attach it to the local preview video element

Example:

```ts
const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
setLocalStream(stream)
if (localVideoRef.current) {
  localVideoRef.current.srcObject = stream
}
```

This is the easiest first milestone because it proves the camera is working before you add the peer connection.

---

### 4. Create the peer connection
Once media works, create the peer connection:

```ts
const pc = new RTCPeerConnection({
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
})
peerConnectionRef.current = pc
```

Then add the local tracks:

```ts
stream.getTracks().forEach(track => {
  pc.addTrack(track, stream)
})
```

This is the point where WebRTC starts to become real.

---

### 5. Add the UI buttons
In the chat room, add a small call UI:

- Start Call
- Accept Call
- End Call

A simple layout is enough:
- local video preview
- remote video area
- buttons at the top or bottom

For now, keep it minimal.

---

### 6. Use WebSocket for signaling
Your server already receives messages from the client. You can extend it to handle these new message types:

- call-request
- call-accept
- offer
- answer
- ice-candidate
- end-call

Example message shape:

```ts
{
  type: "offer",
  roomId: roomCode,
  offer: offerPayload,
  from: "user1"
}
```

The server should forward these messages to the other user in the same room.

Important detail:
- do not broadcast chat messages to everyone for signaling,
- only send to the intended peer.

---

### 7. Implement the offer/answer flow
This is the core of WebRTC.

#### When User A starts a call
1. Get the local stream
2. Create a peer connection
3. Add tracks
4. Create an offer
5. Set it as local description
6. Send it to User B through WebSocket

Example:

```ts
const offer = await pc.createOffer()
await pc.setLocalDescription(offer)

socket.current?.send(JSON.stringify({
  type: "offer",
  roomId: roomCode,
  offer: offer,
  from: "userA"
}))
```

#### When User B receives the offer
1. Create a peer connection if not already created
2. Set the remote description
3. Create an answer
4. Set it as local description
5. Send it back

Example:

```ts
await pc.setRemoteDescription(new RTCSessionDescription(data.offer))
const answer = await pc.createAnswer()
await pc.setLocalDescription(answer)

socket.current?.send(JSON.stringify({
  type: "answer",
  roomId: roomCode,
  answer,
  from: "userB"
}))
```

This is the standard WebRTC handshake.

---

### 8. Handle ICE candidates
ICE candidates are what make the connection work across networks.

Listen for:

```ts
pc.onicecandidate = (event) => {
  if (event.candidate) {
    socket.current?.send(JSON.stringify({
      type: "ice-candidate",
      roomId: roomCode,
      candidate: event.candidate
    }))
  }
}
```

On the receiving side:

```ts
if (data.candidate) {
  await pc.addIceCandidate(new RTCIceCandidate(data.candidate))
}
```

This is the part that often causes the most confusion for beginners, but it is very important.

---

### 9. Show the remote video stream
When the remote peer sends a stream, attach it to the remote video element:

```ts
pc.ontrack = (event) => {
  const [stream] = event.streams
  setRemoteStream(stream)
  if (remoteVideoRef.current) {
    remoteVideoRef.current.srcObject = stream
  }
}
```

Also make sure the local preview is shown immediately when the user grants permission.

---

### 10. Add call cleanup
When the user ends the call:
- stop all tracks
- close the peer connection
- clear the streams
- reset UI state

Example:

```ts
localStream?.getTracks().forEach(track => track.stop())
peerConnectionRef.current?.close()
peerConnectionRef.current = null
setLocalStream(null)
setRemoteStream(null)
setIsInCall(false)
setCallStatus("idle")
```

This prevents memory leaks and stray camera access.

---

## Server-side changes

In server/src/index.ts, keep the current chat room logic but add a simple signaling path.

### Suggested server behavior
- When a message arrives:
  - if it is a normal chat message, broadcast to room
  - if it is a signaling message, forward it to the other socket in the same room

You can do this by keeping a simple room map:

```ts
const chatRooms: Record<string, WebSocket[]> = {}
```

For signaling, you need to identify the peer socket. Since your app is beginner-friendly, the easiest first version is:

- one room can have at most two users,
- if a signaling message comes in, send it to the other socket in that room.

That is enough to get the feature working quickly.

---

## Clean implementation structure

To keep your code clean, I recommend splitting the WebRTC logic into one of these:

1. a custom hook
   - useVideoCall.ts

2. or a utility file
   - webrtc.ts

This will keep client/src/pages/ChatRoom.tsx readable.

A good separation is:
- socket signaling logic
- peer connection setup
- media stream management
- UI state handling

---

## Suggested development order

### Phase 1
- add local camera preview
- add Start Call button

### Phase 2
- add WebSocket signaling message types
- forward offer/answer between peers

### Phase 3
- add ICE candidate handling

### Phase 4
- show remote video
- add end call

### Phase 5
- polish UI and error handling

---

## Beginner-friendly coding hints

### Use refs for the connection object
Do not rely only on React state for the peer connection because it can be recreated unnecessarily.

```ts
const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
```

### Keep socket events separate
Do not mix chat and video logic in one giant handler. Keep one listener for chat and one for signaling.

### Start small
Do not try to build:
- group calls
- screen sharing
- recording
- advanced mute controls

Start with:
- one-to-one
- same-room
- basic start/accept/end

### Use a simple room-based model
For now, assume:
- one room has at most two people
- the second person is the peer

That makes the first implementation much easier.

---

## What I would implement first in your app

If you want the fastest clean path, I would do this exact order:

1. Add local camera preview in the chat room
2. Add a Start Call button
3. Create a peer connection
4. Send an offer over the existing WebSocket
5. Receive the answer and connect
6. Show the remote video
7. Add end call cleanup

That gives you a working MVP quickly.

---

## Important note for beginners

WebRTC is not just “one feature”; it involves three pieces:

- media capture
- signaling
- ICE networking

Your app already has signaling with WebSockets, so the missing part is mostly:
- peer connection setup,
- offer/answer exchange,
- candidate exchange.

That is why your current codebase is a good base.

---

## Next step

If you want, I can do the next step for you by creating a concrete implementation plan specifically for your files and even scaffold the first working MVP code changes in:
- client/src/pages/ChatRoom.tsx
- server/src/index.ts

I can turn this into a step-by-step coding patch so you can implement it fast and cleanly.
