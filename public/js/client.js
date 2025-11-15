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

socket.on('update', (data) => {
    gameBoard = data.board;
    isMyTurn = data.currentPlayer === currentPlayer;
    updateGameBoard(data.board);
    updateCurrentPlayer(data.currentPlayer);
});

socket.on('gameResult', (data) => {
    gameBoard = data.board;
    updateGameBoard(data.board);
    showGameResult(data.result, data.winner);
});

socket.on('chatMessage', (message) => {
    addChatMessage(message);
});

socket.on('playerLeft', (data) => {
    showModal('Thong bao', data.message, () => {
        hideModal();
        showMainMenu();
    });
});

socket.on('error', (data) => {
    showModal('Loi', data.message, () => {
        hideModal();
    });
});

// Rematch handlers
socket.on('rematchRequested', (data) => {
    showRematchRequest();
});

socket.on('rematchAccepted', (data) => {
    hideRematchRequest();
    hideGameResult();
    // Reset game
    if (data.board && data.currentPlayer) {
        gameBoard = data.board;
        isMyTurn = data.currentPlayer === currentPlayer;
        initializeGame(data.board, data.currentPlayer);
        updateCurrentPlayer(data.currentPlayer);
        if (data.players) {
            updatePlayerNames(data.players);
        }
    }
    // Reset rematch button
    const playAgainBtn = document.getElementById('playAgainBtn');
    if (playAgainBtn) {
        playAgainBtn.disabled = false;
        playAgainBtn.textContent = 'Tai dau';
    }
});

socket.on('rematchDeclined', (data) => {
    hideRematchRequest();
    showModal('Thong bao', 'Doi thu da tu choi tai dau!', () => {
        hideModal();
        showMainMenu();
    });
});

socket.on('rematchCancelled', (data) => {
    hideRematchRequest();
    const playAgainBtn = document.getElementById('playAgainBtn');
    if (playAgainBtn) {
        playAgainBtn.disabled = false;
        playAgainBtn.textContent = 'Tai dau';
    }
});

// UI functions
function showMainMenu() {
    mainMenu.classList.add('active');
    gameScreen.classList.remove('active');
    hideGameResult(); // Hide any game result when leaving room
    currentRoomId = null;
    currentPlayer = null;
    gameBoard = null;
    roomInfo.classList.add('hidden');
    joinRoomForm.classList.add('hidden');
    roomIdInput.value = '';
    isPlayingWithAI = false; // Reset AI game state
    ai = null; // Clear AI instance
}

function showGameScreen() {
    mainMenu.classList.remove('active');
    gameScreen.classList.add('active');
    roomInfo.classList.add('hidden');
    joinRoomForm.classList.add('hidden');
    // Update chat visibility depending on whether player is vs AI or human
    updateChatVisibility();
}

// Show or hide chat depending on opponent type
function updateChatVisibility() {
    const chatContainer = document.querySelector('.chat-container');
    if (!chatContainer) return;

    if (isPlayingWithAI) {
        chatContainer.classList.add('hidden');
    } else {
        chatContainer.classList.remove('hidden');
    }
}

function initializeGame(board, currentPlayerTurn) {
    hideGameResult(); // Hide any previous game result
    createBoard(board);
    updateCurrentPlayer(currentPlayerTurn);
    clearChat();
}

function createBoard(board) {
    const gameBoardElement = document.getElementById('gameBoard');
    gameBoardElement.innerHTML = '';
    
    for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
            const cell = document.createElement('button');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            if (board[row][col] === 'X') {
                cell.textContent = 'X';
                cell.classList.add('x');
                cell.classList.add('disabled');
            } else if (board[row][col] === 'O') {
                cell.textContent = 'O';
                cell.classList.add('o');
                cell.classList.add('disabled');
            }
            
            cell.addEventListener('click', () => handleCellClick(row, col, cell));
            gameBoardElement.appendChild(cell);
        }
    }
}

function updateGameBoard(board) {
    const cells = document.querySelectorAll('.cell');
    cells.forEach((cell, index) => {
        const row = Math.floor(index / 10);
        const col = index % 10;
        const value = board[row][col];
        
        cell.textContent = value || '';
        cell.classList.remove('x', 'o', 'disabled');
        
        if (value === 'X') {
            cell.classList.add('x', 'disabled');
        } else if (value === 'O') {
            cell.classList.add('o', 'disabled');
        }
    });
    
    // Enable/disable cells based on turn
    cells.forEach(cell => {
        if (!cell.textContent && !isMyTurn) {
            cell.classList.add('disabled');
        } else if (!cell.textContent && isMyTurn) {
            cell.classList.remove('disabled');
        }
    });
}

function handleCellClick(row, col, cell) {
    if (!isMyTurn || cell.textContent) {
        return;
    }

    if (isPlayingWithAI) {
        // Handle move in AI game
        makeMove(row, col);
        if (!checkGameEnd()) {
            // AI's turn
            isMyTurn = false;
            updateCurrentPlayer('O');
            updateCellStates(); // Disable all cells during AI's turn
            
            setTimeout(() => {
                const aiMove = ai.findBestMove(gameBoard, 'O');
                makeMove(aiMove.row, aiMove.col);
                isMyTurn = true;
                updateCurrentPlayer('X');
                updateCellStates(); // Re-enable empty cells for player's turn
                checkGameEnd();
            }, 500);
        }
    } else if (currentRoomId) {
        // Handle move in online game
        socket.emit('move', {
            roomId: currentRoomId,
            row: row,
            col: col
        });
    }
}

function updateCellStates() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach((cell) => {
        if (!cell.textContent) { // Chỉ cập nhật trạng thái cho các ô trống
            if (isMyTurn) {
                cell.classList.remove('disabled');
            } else {
                cell.classList.add('disabled');
            }
        }
    });
}

function makeMove(row, col) {
    const currentSymbol = isMyTurn ? 'X' : 'O';
    gameBoard[row][col] = currentSymbol;
    updateGameBoard(gameBoard);
}

function checkGameEnd() {
    // Check for win
    if (ai.checkWin(gameBoard, 'X')) {
        showGameResult('X', 'X');
        return true;
    }
    if (ai.checkWin(gameBoard, 'O')) {
        showGameResult('O', 'O');
        return true;
    }

    // Check for draw
    let isDraw = true;
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
            if (!gameBoard[i][j]) {
                isDraw = false;
                break;
            }
        }
        if (!isDraw) break;
    }

    if (isDraw) {
        showGameResult('draw', null);
        return true;
    }

    return false;
}

function updateCurrentPlayer(player) {
    const currentPlayerElement = document.getElementById('currentPlayer');
    currentPlayerElement.textContent = player;
    
    // Update player highlighting
    const playerX = document.querySelector('.player-x');
    const playerO = document.querySelector('.player-o');
    
    playerX.classList.remove('active');
    playerO.classList.remove('active');
    
    if (player === 'X') {
        playerX.classList.add('active');
    } else {
        playerO.classList.add('active');
    }
}

function updatePlayerNames(players) {
    if (players && players.length > 0) {
        players.forEach(playerData => {
            if (playerData.player === 'X') {
                document.getElementById('playerXName').textContent = playerData.name || 'Nguoi choi X';
            } else if (playerData.player === 'O') {
                document.getElementById('playerOName').textContent = playerData.name || 'Nguoi choi O';
            }
        });
    }
}

function hideGameResult() {
    const gameResult = document.getElementById('gameResult');
    gameResult.classList.add('hidden');
}

function showGameResult(result, winner) {
    const gameResult = document.getElementById('gameResult');
    const resultMessage = document.getElementById('resultMessage');
    
    gameResult.classList.remove('hidden');
    
    if (result === 'draw') {
        resultMessage.textContent = 'Hoa!';
        resultMessage.className = 'result-message draw';
    } else if (result === currentPlayer) {
        resultMessage.textContent = 'Ban thang! 🎉';
        resultMessage.className = 'result-message win';
    } else {
        resultMessage.textContent = 'Ban thua! 😢';
        resultMessage.className = 'result-message lose';
    }
    
    // Disable all cells
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.add('disabled');
    });
    
    // Rematch button
    const playAgainBtn = document.getElementById('playAgainBtn');
    playAgainBtn.textContent = 'Tai dau';
    playAgainBtn.onclick = () => {
        if (isPlayingWithAI) {
            // Reset game for AI mode
            gameBoard = Array(10).fill().map(() => Array(10).fill(''));
            isMyTurn = true;
            currentPlayer = 'X';
            hideGameResult();
            initializeGame(gameBoard, currentPlayer);
        } else if (currentRoomId) {
            socket.emit('rematchRequest', { roomId: currentRoomId });
            playAgainBtn.disabled = true;
            playAgainBtn.textContent = 'Dang cho doi thu...';
        }
    };
}

function showRematchRequest() {
    const rematchRequest = document.getElementById('rematchRequest');
    rematchRequest.classList.remove('hidden');
}

function hideRematchRequest() {
    const rematchRequest = document.getElementById('rematchRequest');
    rematchRequest.classList.add('hidden');
}

// Modal functions
function showModal(title, message, onConfirm, onCancel) {
    const modalDialog = document.getElementById('modalDialog');
    const modalContent = modalDialog.querySelector('.modal-content');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalConfirmBtn = document.getElementById('modalConfirmBtn');
    const modalCancelBtn = document.getElementById('modalCancelBtn');
    
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    
    // Set up confirm button
    modalConfirmBtn.onclick = () => {
        if (onConfirm) {
            onConfirm();
        } else {
            hideModal();
        }
    };
    
    // Set up cancel button
    if (onCancel) {
        modalCancelBtn.classList.remove('hidden');
        modalCancelBtn.onclick = () => {
            onCancel();
        };
    } else {
        modalCancelBtn.classList.add('hidden');
    }
    
    // Close modal when clicking on background
    modalDialog.onclick = (e) => {
        if (e.target === modalDialog) {
            if (onCancel) {
                onCancel();
            } else {
                hideModal();
            }
        }
    };
    
    // Prevent closing when clicking on modal content
    modalContent.onclick = (e) => {
        e.stopPropagation();
    };
    
    modalDialog.classList.remove('hidden');
}

function hideModal() {
    const modalDialog = document.getElementById('modalDialog');
    modalDialog.classList.add('hidden');
}

// Chat functions
function addChatMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${message.player.toLowerCase()}`;
    
    // Use player name if available, otherwise use default
    const playerName = message.playerName || `Nguoi choi ${message.player}`;
    
    messageDiv.innerHTML = `
        <div class="chat-message-header">${escapeHtml(playerName)}</div>
        <div class="chat-message-text">${escapeHtml(message.message)}</div>
        <div class="chat-message-time">${message.timestamp}</div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function clearChat() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';
}

// Chat input
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');

function sendChatMessage() {
    const message = chatInput.value.trim();
    if (message && currentRoomId) {
        socket.emit('chat', {
            roomId: currentRoomId,
            message: message
        });
        chatInput.value = '';
    }
}

sendChatBtn.addEventListener('click', sendChatMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendChatMessage();
    }
});

// Utility function
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}