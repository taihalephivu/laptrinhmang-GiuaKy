// WebSocket client connection
const socket = io();

let currentRoomId = null;
let currentPlayer = null;
let gameBoard = null;
let isMyTurn = false;
let playerName = '';

// DOM elements
const mainMenu = document.getElementById('mainMenu');
const gameScreen = document.getElementById('gameScreen');
const createRoomBtn = document.getElementById('createRoomBtn');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const randomMatchBtn = document.getElementById('randomMatchBtn');
const playAIBtn = document.getElementById('playAIBtn');
const roomInfo = document.getElementById('roomInfo');
const roomIdDisplay = document.getElementById('roomIdDisplay');
const joinRoomForm = document.getElementById('joinRoomForm');
const roomIdInput = document.getElementById('roomIdInput');
const confirmJoinBtn = document.getElementById('confirmJoinBtn');
const cancelJoinBtn = document.getElementById('cancelJoinBtn');
const leaveRoomBtn = document.getElementById('leaveRoomBtn');
const playerNameInput = document.getElementById('playerNameInput');
const acceptRematchBtn = document.getElementById('acceptRematchBtn');
const declineRematchBtn = document.getElementById('declineRematchBtn');

// Initialize AI
let ai = null;
let isPlayingWithAI = false;

// Load player name from localStorage
if (localStorage.getItem('playerName')) {
    playerNameInput.value = localStorage.getItem('playerName');
    playerName = localStorage.getItem('playerName');
}

// Play with AI button handler
playAIBtn.addEventListener('click', () => {
    if (currentRoomId) {
        showModal('Thong bao', 'Ban dang o trong mot phong! Hay thoat phong hien tai truoc.', () => {
            hideModal();
        });
        return;
    }

    // Initialize AI game
    ai = new TicTacToeAI();
    isPlayingWithAI = true;
    currentPlayer = 'X'; // Player always plays X
    gameBoard = Array(10).fill().map(() => Array(10).fill(''));
    isMyTurn = true;

    // Set up game screen
    document.getElementById('playerXName').textContent = playerName || 'Nguoi choi';
    document.getElementById('playerOName').textContent = 'May (AI)';
    showGameScreen();
    initializeGame(gameBoard, currentPlayer);
    updateCellStates(); // Ensure cells are properly enabled for player's first turn
});

// Save player name when input changes
playerNameInput.addEventListener('input', (e) => {
    playerName = e.target.value.trim();
    if (playerName) {
        localStorage.setItem('playerName', playerName);
    }
});

// Get player name (with default if empty)
function getPlayerName() {
    const name = playerNameInput.value.trim();
    if (name) {
        return name;
    }
    // Use socket.id if available, otherwise use a random name
    if (socket.id) {
        return `Player ${socket.id.substring(0, 6)}`;
    }
    return `Player ${Math.random().toString(36).substring(2, 8)}`;
}

// Event listeners
createRoomBtn.addEventListener('click', () => {
    // Kiểm tra nếu người chơi đã ở trong phòng
    if (currentRoomId) {
        showModal('Thong bao', 'Ban dang o trong mot phong! Hay thoat phong hien tai truoc.', () => {
            hideModal();
        });
        return;
    }
    const name = getPlayerName();
    socket.emit('create', { playerName: name });
});

joinRoomBtn.addEventListener('click', () => {
    joinRoomForm.classList.remove('hidden');
    roomInfo.classList.add('hidden');
});

cancelJoinBtn.addEventListener('click', () => {
    joinRoomForm.classList.add('hidden');
    roomIdInput.value = '';
});

confirmJoinBtn.addEventListener('click', () => {
    const roomId = roomIdInput.value.trim().toUpperCase();
    if (roomId.length === 6) {
        const name = getPlayerName();
        socket.emit('join', { roomId, playerName: name });
    } else {
        showModal('Loi', 'Ma phong phai co 6 ky tu!', () => {
            hideModal();
        });
    }
});

randomMatchBtn.addEventListener('click', () => {
    // Kiểm tra nếu người chơi đã ở trong phòng
    if (currentRoomId) {
        showModal('Thong bao', 'Ban dang o trong mot phong! Hay thoat phong hien tai truoc khi tim tran moi.', () => {
            hideModal();
        });
        return;
    }
    const name = getPlayerName();
    socket.emit('random', { playerName: name });
    // Vô hiệu hóa nút để tránh nhấn nhiều lần
    randomMatchBtn.disabled = true;
    randomMatchBtn.textContent = 'Dang tim doi thu...';
});

leaveRoomBtn.addEventListener('click', () => {
    if (isPlayingWithAI) {
        showModal('Xac nhan', 'Ban co chac muon thoat tran dau?', () => {
            hideModal();
            showMainMenu();
        }, () => {
            hideModal();
        });
    } else {
        showModal('Xac nhan', 'Ban co chac muon roi phong?', () => {
            if (currentRoomId) {
                socket.emit('leaveRoom', { roomId: currentRoomId });
            }
            hideModal();
            showMainMenu();
        }, () => {
            hideModal();
        });
    }
});

// Rematch buttons
acceptRematchBtn.addEventListener('click', () => {
    if (currentRoomId) {
        socket.emit('rematchAccept', { roomId: currentRoomId });
        hideRematchRequest();
    }
});

declineRematchBtn.addEventListener('click', () => {
    if (currentRoomId) {
        socket.emit('rematchDecline', { roomId: currentRoomId });
        hideRematchRequest();
        showMainMenu();
    }
});

// Socket event handlers
socket.on('roomCreated', (data) => {
    currentRoomId = data.roomId;
    currentPlayer = data.player;
    roomIdDisplay.textContent = data.roomId;
    roomInfo.classList.remove('hidden');
    joinRoomForm.classList.add('hidden');
    if (data.players) {
        updatePlayerNames(data.players);
    }
    
    // Add click handler for copy button
    const copyBtn = document.getElementById('copyRoomId');
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(data.roomId).then(() => {
            const copyText = copyBtn.querySelector('.copy-text');
            copyText.textContent = 'Copied!';
            copyBtn.classList.add('copied');
            setTimeout(() => {
                copyText.textContent = 'Copy';
                copyBtn.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    });
});

socket.on('joined', (data) => {
    currentRoomId = data.roomId;
    currentPlayer = data.player;
    gameBoard = data.board;
    isMyTurn = data.currentPlayer === currentPlayer;
    hideGameResult(); // Hide any previous game result
    showGameScreen();
    initializeGame(data.board, data.currentPlayer);
    if (data.players) {
        updatePlayerNames(data.players);
    }
    // Reset nút random match khi đã vào phòng thành công
    randomMatchBtn.disabled = false;
    randomMatchBtn.textContent = 'Ghep ngau nhien';
});

socket.on('playerJoined', (data) => {
    // Update currentRoomId if not set (shouldn't happen, but just in case)
    if (data.roomId && !currentRoomId) {
        currentRoomId = data.roomId;
    }
    
    if (currentRoomId && (data.roomId === currentRoomId || !data.roomId)) {
        gameBoard = data.board;
        isMyTurn = data.currentPlayer === currentPlayer;
        hideGameResult(); // Hide any previous game result
        
        // If player 1 is still on main menu, switch to game screen
        if (mainMenu.classList.contains('active')) {
            showGameScreen();
            initializeGame(data.board, data.currentPlayer);
        } else {
            updateGameBoard(data.board);
        }
        
        updateCurrentPlayer(data.currentPlayer);
        if (data.players) {
            updatePlayerNames(data.players);
        }
    }
});
