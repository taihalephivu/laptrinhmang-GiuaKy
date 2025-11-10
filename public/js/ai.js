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

    

    