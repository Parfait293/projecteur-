const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

let rooms = {};

io.on('connection', (socket) => {
    // Créer une salle (Prof)
    socket.on('create-room', (profName) => {
        const roomId = Math.floor(1000 + Math.random() * 9000).toString();
        rooms[roomId] = { host: socket.id, hostName: profName, users: [] };
        socket.join(roomId);
        socket.emit('room-created', { roomId, profName });
    });

    // Rejoindre une salle (Élève)
    socket.on('join-room', (data) => {
        if (rooms[data.roomId]) {
            socket.join(data.roomId);
            rooms[data.roomId].users.push({ id: socket.id, name: data.userName });
            socket.emit('joined-success', { roomId: data.roomId, hostName: rooms[data.roomId].hostName });
            io.to(data.roomId).emit('update-users', rooms[data.roomId].users);
        } else {
            socket.emit('error-msg', 'Code introuvable !');
        }
    });

    // Synchronisation Multimédia
    socket.on('sync-content', (data) => {
        socket.to(data.roomId).emit('apply-content', data);
    });

    // Chat et Réactions
    socket.on('send-chat', (data) => {
        io.to(data.roomId).emit('new-chat', data);
    });

    socket.on('disconnect', () => {
        // Nettoyage simplifié pour le prototype
    });
});

server.listen(8080, () => console.log("🚀 Plateforme prête sur port 8080"));