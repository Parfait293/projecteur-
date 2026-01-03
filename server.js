const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Configuration Socket.io pour le Cloud
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Port dynamique pour Render
const PORT = process.env.PORT || 8080;

const publicPath = path.resolve(__dirname, 'public');
app.use(express.static(publicPath));

app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

let rooms = {};

io.on('connection', (socket) => {
    console.log('⚡ Nouvel utilisateur connecté');

    socket.on('create-room', (profName) => {
        const roomId = Math.floor(1000 + Math.random() * 9000).toString();
        rooms[roomId] = { host: socket.id, hostName: profName, users: [] };
        socket.join(roomId);
        socket.emit('room-created', { roomId, profName });
        console.log(`🏠 Salle ${roomId} créée par ${profName}`);
    });

    socket.on('join-room', (data) => {
        if (rooms[data.roomId]) {
            socket.join(data.roomId);
            rooms[data.roomId].users.push({ id: socket.id, name: data.userName });
            socket.emit('joined-success', { roomId: data.roomId, hostName: rooms[data.roomId].hostName });
            io.to(data.roomId).emit('update-users', rooms[data.roomId].users.length + 1);
        } else {
            socket.emit('error-msg', 'Code introuvable !');
        }
    });

    socket.on('sync-content', (data) => {
        socket.to(data.roomId).emit('apply-content', data);
    });

    socket.on('send-chat', (data) => {
        io.to(data.roomId).emit('new-chat', data);
    });

    socket.on('disconnect', () => {
        console.log('❌ Utilisateur déconnecté');
    });
});

server.listen(PORT, () => {
    console.log(`✅ Serveur en ligne sur le port ${PORT}`);
});
