/**
 * Socket.IO initialization and common functionality
 */

let socket = null;

/**
 * Initialize the Socket.IO connection
 */
function initializeSocket() {
    // Create socket connection
    socket = io();
    
    // Common socket event handlers
    socket.on('connect', function() {
        console.log('Connected to socket server');
    });
    
    socket.on('disconnect', function() {
        console.log('Disconnected from socket server');
    });
    
    socket.on('connect_error', function(error) {
        console.error('Socket connection error:', error);
    });
    
    return socket;
}
