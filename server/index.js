import express from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';
import { connectDB } from './config/db.js';
import serverRoutes from './routes/serverRoutes.js';
import auctionRoutes from './routes/auctionRoutes.js';
import { initAuctionSocket } from './sockets/auctionSocket.js';
import { warmServerResources } from './controllers/serverController.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/ping', async (req, res) => {
  try {
    await connectDB();
    await warmServerResources();
    return res.status(200).send('Server alive');
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Warmup failed' });
  }
});

app.use('/api/server', serverRoutes);
app.use('/api/auction', auctionRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Server error' });
});

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

initAuctionSocket(io);

const PORT = process.env.PORT || 4000;

Promise.all([connectDB(), warmServerResources()])
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect DB', error);
    process.exit(1);
  });
