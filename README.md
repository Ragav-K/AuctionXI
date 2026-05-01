# AuctionXI

AuctionXI is a real-time, interactive IPL auction simulation platform built with React and Node.js. It allows users to host and participate in live player auctions with real-time bidding, team management, and dynamic player scouting.

## Features

- **Real-time Bidding**: Experience the thrill of a live auction with WebSockets powering instant bid updates.
- **Auctioneer Controls**: Host the auction with powerful controls to queue players, start/pause bidding, and resolve auctions.
- **Team Management**: Join teams, manage your budget, and build your dream squad.
- **Player Scouting**: View detailed player stats, categories, and AI-powered insights.
- **Dynamic Timer**: A countdown timer keeps the pressure on during bidding wars.

## Tech Stack

### Frontend
- React 19
- Vite
- Tailwind CSS
- Zustand (State Management)
- Socket.IO Client
- React Router DOM
- Framer Motion

### Backend
- Node.js
- Express
- Socket.IO
- MongoDB (via Mongoose)
- dotenv

## Prerequisites

- Node.js (v18 or higher recommended)
- MongoDB instance (local or Atlas)

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd auctionxi
   ```

2. **Install Frontend Dependencies:**
   ```bash
   npm install
   ```

3. **Install Backend Dependencies:**
   ```bash
   cd server
   npm install
   ```

4. **Environment Configuration:**
   - Create a `.env` file in the `server` directory based on `.env.example` (if available) or add the following variables:
     ```env
     PORT=4000
     MONGO_URI=your_mongodb_connection_string
     ```

5. **Start the Development Server:**
   - Open a terminal and start the backend:
     ```bash
     cd server
     npm run dev
     ```
   - Open another terminal and start the frontend:
     ```bash
     npm run dev
     ```

6. **Access the Application:**
   Open your browser and navigate to `http://localhost:3000`.

## Project Structure

- `src/`: Frontend React application.
  - `components/`: UI components.
  - `hooks/`: Custom React hooks (e.g., `useAuctionSocket`).
  - `store/`: Zustand state management.
  - `services/`: API integration.
- `server/`: Backend Express application.
  - `models/`: Mongoose models.
  - `routes/`: Express API routes.
  - `sockets/`: Socket.IO logic.
  - `controllers/`: Request handlers.

## License

This project is licensed under the Apache 2.0 License.
