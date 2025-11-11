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

        // Kiểm tra đường chéo phụ
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