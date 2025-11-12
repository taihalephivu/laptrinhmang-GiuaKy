class TicTacToeAI {
    constructor() {
        this.maxDepth = 2; 

   
    evaluate(board, player) {
      
        if (this.checkWin(board, player)) {
            return player === 'X' ? 100 : -100;
        }
        if (this.checkWin(board, player === 'X' ? 'O' : 'X')) {
            return player === 'X' ? -100 : 100;
        }

       
        return this.evaluatePosition(board, player);
    }

    evaluatePosition(board, player) {
        let score = 0;
        const opponent = player === 'X' ? 'O' : 'X';

       
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j <= 5; j++) {
                let playerCount = 0;
                let opponentCount = 0;
                for (let k = 0; k < 5; k++) {
                    if (board[i][j + k] === player) playerCount++;
                    if (board[i][j + k] === opponent) opponentCount++;
                }
                score += this.evaluateSequence(playerCount, opponentCount);
            }
        }

        
        for (let i = 0; i <= 5; i++) {
            for (let j = 0; j < 10; j++) {
                let playerCount = 0;
                let opponentCount = 0;
                for (let k = 0; k < 5; k++) {
                    if (board[i + k][j] === player) playerCount++;
                    if (board[i + k][j] === opponent) opponentCount++;
                }
                score += this.evaluateSequence(playerCount, opponentCount);
            }
        }
    
        for (let i = 0; i <= 5; i++) {
            for (let j = 0; j <= 5; j++) {
                let playerCount = 0;
                let opponentCount = 0;
                for (let k = 0; k < 5; k++) {
                    if (board[i + k][j + k] === player) playerCount++;
                    if (board[i + k][j + k] === opponent) opponentCount++;
                }
                score += this.evaluateSequence(playerCount, opponentCount);
            }
        }

        
        for (let i = 0; i <= 5; i++) {
            for (let j = 4; j < 10; j++) {
                let playerCount = 0;
                let opponentCount = 0;
                for (let k = 0; k < 5; k++) {
                    if (board[i + k][j - k] === player) playerCount++;
                    if (board[i + k][j - k] === opponent) opponentCount++;
                }
                score += this.evaluateSequence(playerCount, opponentCount);
            }
        }

        return score;
    }

    
    evaluateSequence(playerCount, opponentCount) {
        if (opponentCount === 0) {
            switch (playerCount) {
                case 4: return 1000;
                case 3: return 100;
                case 2: return 10;
                case 1: return 1;
            }
        }
        if (playerCount === 0) {
            switch (opponentCount) {
                case 4: return -1000;
                case 3: return -100;
                case 2: return -10;
                case 1: return -1;
            }
        }
        return 0;
    }  

     // Kiểm tra chiến thắng
    checkWin(board, player) {
        // Kiểm tra hàng ngang
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j <= 5; j++) {
                let count = 0;
                for (let k = 0; k < 5; k++) {
                    if (board[i][j + k] === player) count++;
                }
                if (count === 5) return true;
            }
        }

        // Kiểm tra hàng dọc
        for (let i = 0; i <= 5; i++) {
            for (let j = 0; j < 10; j++) {
                let count = 0;
                for (let k = 0; k < 5; k++) {
                    if (board[i + k][j] === player) count++;
                }
                if (count === 5) return true;
            }
        }

        // Kiểm tra đường chéo chính
        for (let i = 0; i <= 5; i++) {
            for (let j = 0; j <= 5; j++) {
                let count = 0;
                for (let k = 0; k < 5; k++) {
                    if (board[i + k][j + k] === player) count++;
                }
                if (count === 5) return true;
            }
        }