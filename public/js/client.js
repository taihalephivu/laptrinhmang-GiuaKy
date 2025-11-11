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