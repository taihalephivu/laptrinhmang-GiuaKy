const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Game state management
const rooms = new Map(); 
const players = new Map(); 

// Generate unique room ID
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Initialize empty board 10x10
function createEmptyBoard() {
  return Array(10).fill(null).map(() => Array(10).fill(null));
}

// Check win condition (5 in a row for 10x10 board)
function checkWin(board, row, col, player) {
  const directions = [
    [0, 1],   // horizontal
    [1, 0],   // vertical
    [1, 1],   // diagonal \
    [1, -1]   // diagonal /
  ];

  for (let [dx, dy] of directions) {
    let count = 1; // Count current cell

    // Check positive direction
    for (let i = 1; i < 5; i++) {
      const newRow = row + dx * i;
      const newCol = col + dy * i;
      if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10 && 
          board[newRow][newCol] === player) {
        count++;
      } else {
        break;
      }
    }

    // Check negative direction
    for (let i = 1; i < 5; i++) {
      const newRow = row - dx * i;
      const newCol = col - dy * i;
      if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10 && 
          board[newRow][newCol] === player) {
        count++;
      } else {
        break;
      }
    }

    if (count >= 5) {
      return true;
    }
  }

  return false;
}

// Check if board is full (draw)
function checkDraw(board) {
    for (let row of board) {
      for (let cell of row) {
        if (cell === null) {
          return false;
        }
      }
    }
    return true;
  }
  
// connect socket
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  // Create room
  socket.on('create', (data) => {
    const roomId = generateRoomId();
    const room = {
      id: roomId,
      players: [socket.id],
      board: createEmptyBoard(),
      currentPlayer: 'X',
      status: 'waiting',
      messages: []
    };
    rooms.set(roomId, room);
    const playerName = data?.playerName || `Player ${socket.id.substring(0, 6)}`;
    players.set(socket.id, { roomId, player: 'X', name: playerName });
    
    socket.join(roomId);
    socket.emit('roomCreated', { 
      roomId, 
      player: 'X',
      players: [{ roomId, player: 'X', name: playerName }]
    });
    console.log(`Room created: ${roomId} by ${socket.id} as ${playerName}`);
  });

  // Join room
  socket.on('join', (data) => {
    const { roomId, playerName: clientPlayerName } = data;
    const room = rooms.get(roomId);

    if (!room) {
      socket.emit('error', { message: 'Phong khong ton tai!' });
      return;
    }

    if (room.players.length >= 2) {
      socket.emit('error', { message: 'Phong da day!' });
      return;
    }

    if (room.players.includes(socket.id)) {
      socket.emit('error', { message: 'Ban da o trong phong nay!' });
      return;
    }

    room.players.push(socket.id);
    room.status = 'playing';
    const player = 'O'; // Second player is always O
    const playerName = clientPlayerName || `Player ${socket.id.substring(0, 6)}`;
    players.set(socket.id, { roomId, player, name: playerName });

    socket.join(roomId);
    const allPlayers = room.players.map(id => players.get(id));
    socket.emit('joined', { 
      roomId, 
      player, 
      board: room.board, 
      currentPlayer: room.currentPlayer,
      players: allPlayers
    });

