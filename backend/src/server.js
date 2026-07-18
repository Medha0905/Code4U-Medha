require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const createApp = require('./app');
const { initSockets } = require('./sockets');
const { startCronJobs } = require('./jobs/cron');

const PORT = process.env.PORT || 5000;

const app = createApp();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),
    credentials: true,
  },
});

app.set('io', io);
initSockets(io);
startCronJobs(io);

server.listen(PORT, () => {
  console.log(`Smart Canteen API listening on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});
