// patterns/SocketAdapter.js
class SocketAdapter {
    constructor(io) {
      this.io = io;
    }
  
    emitToRoom(room, event, data) {
      this.io.to(room).emit(event, data);
    }
  
    emitToAll(event, data) {
      this.io.emit(event, data);
    }
  
    emitToSocket(socket, event, data) {
      socket.emit(event, data);
    }
  
    joinRoom(socket, room) {
      socket.join(room);
    }
  
    leaveRoom(socket, room) {
      socket.leave(room);
    }
  }
  
  module.exports = SocketAdapter;