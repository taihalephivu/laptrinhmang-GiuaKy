#Bài Tập Giữa Kỳ Lập Trình Mạng
Thành Viên Nhóm
- Nguyễn Việt Dũng
- Cao Xuân Dự
- Đoàn Quang Hưng
- Nguyễn Duy Khánh
- Nông Hùng Phi

# Game X-O Online
Trò chơi X-O online đa người chơi sử dụng WebSocket
## Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Chạy server:
```bash
npm start
```

3. Mở trình duyệt và truy cập:
```
http://localhost:3000
```

## Công nghệ sử dụng

- **Backend**: Node.js, Express, Socket.IO
- **Frontend**: HTML5, CSS3, JavaScript
- **WebSocket**: Socket.IO cho giao tiếp thời gian thực

## Cấu trúc dự án

```
game_X-O/
├── server.js          # Server Node.js với WebSocket
├── package.json       # Dependencies
├── public/
│   ├── index.html    # Giao diện chính
│   ├── css/
│   │   └── style.css # Styling
│   └── js/
│       ├── client.js # WebSocket client logic
│       └── game.js   # Game utilities
|	|__ ai.js # chế độ đấu với bot
└── README.md
```

## Luật chơi

- Bàn cờ 10x10
- Người chơi X đi trước
- Thắng khi có 5 quân liên tiếp (ngang, dọc, hoặc chéo)
- Hòa khi bàn cờ đầy và không ai thắng
- Chơi với máy

