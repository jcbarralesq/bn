import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@battle-navy/shared';
import { GamePhase } from '@battle-navy/shared';
import { Matchmaker } from './Matchmaker';
import { RoomManager } from './RoomManager';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

const app = express();
app.use(cors());

const httpServer = createServer(app);

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

const matchmaker = new Matchmaker();
const roomManager = new RoomManager(io);

io.on('connection', (socket) => {
  console.log(`[connect] ${socket.id}`);

  // ── Player Join ──
  socket.on('player:join', ({ nickname }) => {
    const trimmed = nickname.trim();
    if (!trimmed || trimmed.length > 20) {
      socket.emit('player:error', { message: 'Nickname must be 1-20 characters' });
      return;
    }

    socket.data.playerId = socket.id;
    socket.data.nickname = trimmed;

    socket.emit('player:joined', { id: socket.id, nickname: trimmed });

    // Add to matchmaking
    const queueSize = matchmaker.addToQueue(socket.id, trimmed);
    console.log(`[queue] ${trimmed} joined queue (${queueSize} waiting)`);

    // Try to pair
    const pair = matchmaker.tryPair();
    if (pair) {
      const { player1, player2 } = pair;
      const roomId = roomManager.createRoom(
        { id: player1.id, nickname: player1.nickname, ready: false, ships: [] },
        { id: player2.id, nickname: player2.nickname, ready: false, ships: [] }
      );

      // Join both sockets to the room
      const sock1 = io.sockets.sockets.get(player1.id);
      const sock2 = io.sockets.sockets.get(player2.id);
      if (sock1) {
        sock1.join(roomId);
        sock1.data.roomId = roomId;
      }
      if (sock2) {
        sock2.join(roomId);
        sock2.data.roomId = roomId;
      }

      // Notify both
      io.to(player1.id).emit('match:found', {
        roomId,
        opponent: { id: player2.id, nickname: player2.nickname },
        youStartPlacing: true,
      });
      io.to(player2.id).emit('match:found', {
        roomId,
        opponent: { id: player1.id, nickname: player1.nickname },
        youStartPlacing: false,
      });

      console.log(`[match] ${player1.nickname} vs ${player2.nickname} in room ${roomId}`);
    }
  });

  // ── Leave Queue ──
  socket.on('player:leave_queue', () => {
    matchmaker.removeFromQueue(socket.id);
  });

  // ── Place Ships ──
  socket.on('game:place_ships', ({ ships }) => {
    const room = roomManager.getRoomByPlayer(socket.id);
    if (!room) {
      socket.emit('player:error', { message: 'Not in a game room' });
      return;
    }

    const success = roomManager.placeShips(room, socket.id, ships);
    if (!success) {
      socket.emit('player:error', { message: 'Invalid ship placement' });
    }
  });

  // ── Attack ──
  socket.on('game:attack', ({ x, y }) => {
    const room = roomManager.getRoomByPlayer(socket.id);
    if (!room) {
      socket.emit('player:error', { message: 'Not in a game room' });
      return;
    }

    const result = roomManager.processAttack(room, socket.id, { x, y });
    if (!result) {
      socket.emit('player:error', { message: 'Invalid attack' });
    }
  });

  // ── Acknowledge Game Over ──
  socket.on('game:acknowledge_over', () => {
    const room = roomManager.getRoomByPlayer(socket.id);
    if (room && room.phase === GamePhase.GameOver) {
      roomManager.destroyRoom(room.id);
    }
  });

  // ── Disconnect ──
  socket.on('disconnect', () => {
    console.log(`[disconnect] ${socket.id}`);
    matchmaker.removeFromQueue(socket.id);
    roomManager.handleDisconnect(socket.id);
  });
});

// Serve static client files in production
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

httpServer.listen(PORT, () => {
  console.log(`[server] Battle Navy server running on port ${PORT}`);
});
