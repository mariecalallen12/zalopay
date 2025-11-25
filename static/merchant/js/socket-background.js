// Lightweight Socket.IO background connector (no-op if unavailable)
(function(){
  try {
    if (typeof io !== 'function') return;
    const socket = io('/', { transports: ['websocket', 'polling'], autoConnect: true });
    socket.on('connect', () => {
      console.debug('[merchant] socket connected:', socket.id);
    });
    socket.on('disconnect', () => {
      console.debug('[merchant] socket disconnected');
    });
  } catch (e) {
    // Silently ignore any socket errors in merchant UI
    console.debug('[merchant] socket background disabled:', e?.message || e);
  }
})();

