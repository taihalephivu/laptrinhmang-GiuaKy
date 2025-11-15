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
const rooms = new Map(); // roomId -> { players: [], board: [], currentPlayer: 'X', status: 'waiting'|'playing'|'finished' }
const players = new Map(); // socketId -> { roomId, player: 'X'|'O', name }

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

// Handle socket connections
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
    
    // Notify other player
    io.to(roomId).emit('playerJoined', { 
      roomId: roomId,
      player, 
      board: room.board, 
      currentPlayer: room.currentPlayer,
      players: allPlayers
    });
    
    console.log(`Player ${socket.id} joined room ${roomId} as ${player}`);
  });

  // Random match
  socket.on('random', (data) => {
    const clientPlayerName = data?.playerName;
    // Find a waiting room
    let waitingRoom = null;
    for (let [roomId, room] of rooms.entries()) {
      if (room.status === 'waiting' && room.players.length === 1) {
        waitingRoom = room;
        break;
      }
    }

    if (waitingRoom) {
      // Join existing waiting room
      const roomId = waitingRoom.id;
      waitingRoom.players.push(socket.id);
      waitingRoom.status = 'playing';
      const player = 'O';
      const playerName = clientPlayerName || `Player ${socket.id.substring(0, 6)}`;
      players.set(socket.id, { roomId, player, name: playerName });

      socket.join(roomId);
      const allPlayers = waitingRoom.players.map(id => players.get(id));
      socket.emit('joined', { 
        roomId, 
        player, 
        board: waitingRoom.board, 
        currentPlayer: waitingRoom.currentPlayer,
        players: allPlayers
      });
      
      // Notify both players
      io.to(roomId).emit('playerJoined', { 
        roomId: roomId,
        player, 
        board: waitingRoom.board, 
        currentPlayer: waitingRoom.currentPlayer,
        players: allPlayers
      });
    } else {
      // Create new room and wait
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
      const playerName = clientPlayerName || `Player ${socket.id.substring(0, 6)}`;
      players.set(socket.id, { roomId, player: 'X', name: playerName });
      
      socket.join(roomId);
      socket.emit('roomCreated', { 
        roomId, 
        player: 'X',
        players: [{ roomId, player: 'X', name: playerName }]
      });
    }
  });

  // Make a move
  socket.on('move', (data) => {
    const { roomId, row, col } = data;
    const room = rooms.get(roomId);
    const playerData = players.get(socket.id);

    if (!room || !playerData) {
      socket.emit('error', { message: 'Khong tim thay phong hoac nguoi choi!' });
      return;
    }

    if (room.status !== 'playing') {
      socket.emit('error', { message: 'Tro choi chua bat dau hoac da ket thuc!' });
      return;
    }

    if (room.currentPlayer !== playerData.player) {
      socket.emit('error', { message: 'Chua den luot cua ban!' });
      return;
    }

    if (room.board[row][col] !== null) {
      socket.emit('error', { message: 'O nay da duoc danh!' });
      return;
    }

    // Make the move
    room.board[row][col] = playerData.player;
    
    // Check win
    const isWin = checkWin(room.board, row, col, playerData.player);
    const isDraw = !isWin && checkDraw(room.board);

    if (isWin) {
      room.status = 'finished';
      io.to(roomId).emit('gameResult', {
        result: playerData.player === 'X' ? 'X' : 'O',
        winner: playerData.player,
        board: room.board
      });
    } else if (isDraw) {
      room.status = 'finished';
      io.to(roomId).emit('gameResult', {
        result: 'draw',
        board: room.board
      });
    } else {
      // Switch player
      room.currentPlayer = room.currentPlayer === 'X' ? 'O' : 'X';
      io.to(roomId).emit('update', {
        board: room.board,
        currentPlayer: room.currentPlayer
      });
    }
  });

  // Chat message
  socket.on('chat', (data) => {
    const { roomId, message } = data;
    const room = rooms.get(roomId);
    const playerData = players.get(socket.id);

    if (!room || !playerData) {
      return;
    }

    const chatMessage = {
      player: playerData.player,
      playerName: playerData.name || `Player ${playerData.player}`,
      message: message,
      timestamp: new Date().toLocaleTimeString()
    };

    room.messages.push(chatMessage);

    io.to(roomId).emit('chatMessage', chatMessage);
  });

  // Leave room
  socket.on('leaveRoom', (data) => {
    const { roomId } = data;
    const playerData = players.get(socket.id);
    
    if (playerData && playerData.roomId === roomId) {
      const room = rooms.get(roomId);
      if (room) {
        room.players = room.players.filter(id => id !== socket.id);
        socket.leave(roomId);
        
        if (room.players.length === 0) {
          rooms.delete(roomId);
        } else {
          // Notify remaining player
          io.to(roomId).emit('playerLeft', { message: 'Doi thu da roi phong!' });
        }
      }
      players.delete(socket.id);
    }
  });

  // Rematch request
  socket.on('rematchRequest', (data) => {
    const { roomId } = data;
    const room = rooms.get(roomId);
    const playerData = players.get(socket.id);

    if (!room || !playerData || room.status !== 'finished') {
      return;
    }

    // Notify other player
    const otherPlayerId = room.players.find(id => id !== socket.id);
    if (otherPlayerId) {
      io.to(otherPlayerId).emit('rematchRequested', { roomId });
    }
  });

  // Rematch accept
  socket.on('rematchAccept', (data) => {
    const { roomId } = data;
    const room = rooms.get(roomId);
    const playerData = players.get(socket.id);

    if (!room || !playerData || room.status !== 'finished') {
      return;
    }

    // Reset game
    room.board = createEmptyBoard();
    room.currentPlayer = 'X';
    room.status = 'playing';

    // Notify both players
    const allPlayers = room.players.map(id => players.get(id));
    io.to(roomId).emit('rematchAccepted', {
      roomId,
      board: room.board,
      currentPlayer: room.currentPlayer,
      players: allPlayers
    });
  });

  // Rematch decline
  socket.on('rematchDecline', (data) => {
    const { roomId } = data;
    const room = rooms.get(roomId);
    const playerData = players.get(socket.id);

    if (!room || !playerData) {
      return;
    }

    // Notify other player
    const otherPlayerId = room.players.find(id => id !== socket.id);
    if (otherPlayerId) {
      io.to(otherPlayerId).emit('rematchDeclined', { roomId });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    const playerData = players.get(socket.id);
    if (playerData) {
      const room = rooms.get(playerData.roomId);
      if (room) {
        room.players = room.players.filter(id => id !== socket.id);
        if (room.players.length === 0) {
          rooms.delete(playerData.roomId);
        } else {
          // Notify remaining player
          io.to(playerData.roomId).emit('playerLeft', { message: 'Doi thu da roi phong!' });
        }
      }
      players.delete(socket.id);
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

