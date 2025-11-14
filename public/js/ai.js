class TicTacToeAI {
    constructor() {
        this.maxDepth = 2; // Độ sâu tìm kiếm cho minimax
    }

    // Hàm đánh giá trạng thái bàn cờ
    evaluate(board, player) {
        // Kiểm tra chiến thắng
        if (this.checkWin(board, player)) {
            return player === 'X' ? 100 : -100;
        }
        if (this.checkWin(board, player === 'X' ? 'O' : 'X')) {
            return player === 'X' ? -100 : 100;
        }

        // Tính điểm dựa trên số lượng cơ hội thắng
        return this.evaluatePosition(board, player);
    }

    // Đánh giá vị trí dựa trên số lượng cơ hội thắng
    evaluatePosition(board, player) {
        let score = 0;
        const opponent = player === 'X' ? 'O' : 'X';

        // Kiểm tra theo hàng
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

        // Kiểm tra theo cột
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

        // Kiểm tra đường chéo chính
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

    // Đánh giá giá trị của một chuỗi X-O
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

        // Kiểm tra đường chéo phụ
        for (let i = 0; i <= 5; i++) {
            for (let j = 4; j < 10; j++) {
                let count = 0;
                for (let k = 0; k < 5; k++) {
                    if (board[i + k][j - k] === player) count++;
                }
                if (count === 5) return true;
            }
        }

        return false;
    }


    minimax(board, depth, alpha, beta, isMaximizing, player) {
        if (depth === 0) {
            return this.evaluate(board, player);
        }

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 10; j++) {
                    if (!board[i][j]) {
                        board[i][j] = player;
                        const evaluation = this.minimax(board, depth - 1, alpha, beta, false, player);
                        board[i][j] = '';
                        maxEval = Math.max(maxEval, evaluation);
                        alpha = Math.max(alpha, evaluation);
                        if (beta <= alpha) break;
                    }
                }
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            const opponent = player === 'X' ? 'O' : 'X';
            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 10; j++) {
                    if (!board[i][j]) {
                        board[i][j] = opponent;
                        const evaluation = this.minimax(board, depth - 1, alpha, beta, true, player);
                        board[i][j] = '';
                        minEval = Math.min(minEval, evaluation);
                        beta = Math.min(beta, evaluation);
                        if (beta <= alpha) break;
                    }
                }
            }
            return minEval;
        }
    }

    
    findBestMove(board, player) {
        let bestScore = -Infinity;
        let bestMove = { row: -1, col: -1 };

        
        const validMoves = this.getValidMoves(board);

        for (const move of validMoves) {
            board[move.row][move.col] = player;
            const score = this.minimax(board, this.maxDepth, -Infinity, Infinity, false, player);
            board[move.row][move.col] = '';

            if (score > bestScore) {
                bestScore = score;
                bestMove = { row: move.row, col: move.col };
            }
        }

        return bestMove;
    }

    getValidMoves(board) {
        const moves = new Set();
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];

    for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                if (board[i][j]) {
                    // Thêm các ô xung quanh vào danh sách nước đi hợp lệ
                    for (const [dx, dy] of directions) {
                        const newRow = i + dx;
                        const newCol = j + dy;
                        if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10 && !board[newRow][newCol]) {
                            moves.add(JSON.stringify({row: newRow, col: newCol}));
                        }
                    }
                }
            }
        }
}