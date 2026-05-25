# Loopin

Loopin is a minimal real-time temporary chat application built using WebSockets.  
Users can create private rooms, share a room code, and chat instantly with other users connected to the same room.

---

## Features

- Real-time communication using WebSockets
- Temporary room-based chat architecture
- Create and join chat rooms using unique room codes
- Live message broadcasting to connected users
- Sender and receiver message alignment
- Reusable React component architecture
- Room validation before messaging
- Lightweight and fast real-time communication

---

## Tech Stack

### Frontend
- React
- TypeScript
- Tailwind CSS

### Backend
- Node.js
- WebSocket (`ws`)
- TypeScript

---

## Project Structure

```bash
Loopin/
├── client/
├── server/
├── README.md
```

---

## How It Works

1. A user creates a room.
2. A unique room code is generated.
3. Another user joins using the same room code.
4. Messages are sent through a WebSocket server.
5. The server broadcasts messages to all sockets connected to that room.

---

## WebSocket Message Structure

```json
{
  "type": "chat",
  "RoomId": "ABCD12",
  "message": "Hello",
  "isOwner": false
}
```

---

## Getting Started

### Clone the repository

```bash
git clone <your-repo-url>
cd Loopin
```

---

## Frontend Setup

```bash
cd client
npm install
npm run dev
```

Runs on:

```bash
http://localhost:5173
```

---

## Backend Setup

```bash
cd server
npm install
npm run dev
```

Runs WebSocket server on:

```bash
ws://localhost:8080
```

---

## Purpose

This project was built to understand real-time systems and explore how WebSockets work internally compared to traditional HTTP request-response communication.

---