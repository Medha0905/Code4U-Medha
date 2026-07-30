const { verifyAccessToken } = require('../utils/jwt');

/**
 * Room conventions:
 *   shop:<shopId>        -> everyone viewing that shop (students + vendor)
 *   user:<userId>        -> personal notification channel
 *   vendor:<vendorUserId>-> vendor's own dashboard channel
 */
function initSockets(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (token) {
        const decoded = verifyAccessToken(token);
        socket.userId = decoded.sub;
      }
      next();
    } catch (e) {
      next(); // allow anonymous/public connections (e.g. public shop queue view)
    }
  });

  io.on('connection', (socket) => {
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    socket.on('shop:subscribe', (shopId) => {
      if (shopId) socket.join(`shop:${shopId}`);
    });

    socket.on('shop:unsubscribe', (shopId) => {
      if (shopId) socket.leave(`shop:${shopId}`);
    });

    socket.on('order:subscribe', (orderId) => {
      if (orderId) socket.join(`order:${orderId}`);
    });

    socket.on('order:unsubscribe', (orderId) => {
      if (orderId) socket.leave(`order:${orderId}`);
    });

    socket.on('disconnect', () => {});
  });
}

/** Helper broadcasters used by controllers/services. */
function emitQueueUpdate(io, shopId, queue) {
  io.to(`shop:${shopId}`).emit('queue:update', queue);
}
function emitInventoryUpdate(io, shopId, menuItem) {
  io.to(`shop:${shopId}`).emit('inventory:update', menuItem);
}
function emitOrderStatusUpdate(io, shopId, order) {
  io.to(`shop:${shopId}`).emit('order:status', order);
}
function emitKitchenLoad(io, shopId, load) {
  io.to(`shop:${shopId}`).emit('kitchen:load', load);
}
function emitSeatStatus(io, shopId, seatStatus) {
  io.to(`shop:${shopId}`).emit('seat:status', seatStatus);
}
function emitNotification(io, userId, notification) {
  io.to(`user:${userId}`).emit('notification:new', notification);
}
function emitNewMessage(io, orderId, message) {
  io.to(`order:${orderId}`).emit('message:new', message);
}

module.exports = {
  initSockets,
  emitQueueUpdate,
  emitInventoryUpdate,
  emitOrderStatusUpdate,
  emitKitchenLoad,
  emitSeatStatus,
  emitNotification,
  emitNewMessage,
};
