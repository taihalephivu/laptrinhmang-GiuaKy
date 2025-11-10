// Game logic and utilities
// This file contains additional game-related functions if needed

// Add active state styling for current player
const style = document.createElement('style');
style.textContent = `
    .player.active {
        transform: scale(1.1);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        transition: all 0.3s ease;
    }
    
    .player-x.active {
        background: #1976d2;
        color: white;
    }
    
    .player-o.active {
        background: #f57c00;
        color: white;
    }
`;
document.head.appendChild(style);

