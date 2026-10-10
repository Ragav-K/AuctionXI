# AuctionXI

A multiplayer cricket auction platform. Create or join an auction room, bid in real time on IPL players, and build your dream XI.

## Features

- **Auction rooms:** an auctioneer creates a room and players join with a code
- **Real-time bidding:** live bids, countdowns and results over Socket.IO
- **Squad building:** track your purchased players on your own squad card
- **Leaderboard:** compare teams as the auction progresses
- **Team customisation:** pick your team colour
- **Player dataset:** built-in IPL players dataset (`IPL Players Dataset.json`)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Vite |
| State | Zustand (`src/store`) |
| Backend | Node.js, Express |
| Real-time | Socket.IO |
| Database | MongoDB (Mongoose) |
| Hosting | Vercel (frontend) |

## Project Structure

```
AuctionXI/
├── src/        # React frontend (components, store, hooks, services)
├── server/     # Express + Socket.IO backend (routes, controllers, models, sockets)
└── IPL Players Dataset.json
```

## Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB database (local or Atlas)

### Setup

1. Install dependencies:
   ```bash
   npm install
   cd server && npm install
   ```
2. Copy `.env.example` to `.env` and fill in your values:
   ```
   MONGO_URI=your_mongodb_connection_string
   PORT=4000
   VITE_API_URL=http://localhost:4000
   VITE_SOCKET_URL=http://localhost:4000
   ```
3. Start the backend:
   ```bash
   cd server
   npm run dev
   ```
4. In a second terminal, start the frontend:
   ```bash
   npm run dev
   ```
   The app runs at `http://localhost:3000`.

### Build

```bash
npm run build
```

> Never commit `.env` files or database credentials.
