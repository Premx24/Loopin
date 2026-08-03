# Loopin

A minimal real-time chat application built with **WebSockets** and **WebRTC** for instant messaging and peer-to-peer video calls.

## Features

- Real-time messaging with WebSockets
- Peer-to-peer video calling using WebRTC
- Temporary room-based communication
- Room creation and joining with unique codes
- Lightweight and responsive interface

## Tech Stack

**Frontend**
- React
- TypeScript
- Tailwind CSS

**Backend**
- Node.js
- TypeScript
- ws

## Project Structure

```text
Loopin/
├── client/
├── server/
└── README.md
```

## Getting Started

### Clone the repository

```bash
git clone <repository-url>
cd Loopin
```

### Client

```bash
cd client
npm install
npm run dev
```

Runs on `http://localhost:5173`

### Server

```bash
cd server
npm install
npm run dev
```

Runs on `ws://localhost:8080`

## How It Works

1. Create or join a room.
2. Exchange messages through a WebSocket signaling server.
3. Start a peer-to-peer video call using WebRTC.
4. Audio and video are streamed directly between connected peers.

## Project Goal

Loopin was built to explore real-time communication by implementing WebSockets for signaling and WebRTC for peer-to-peer media streaming.