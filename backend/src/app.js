const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(
    cors({
      origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));
  if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

  app.use(
    '/api',
    rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false }),
  );

  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  app.use('/api/v1', routes);

  app.get('/', (req, res) => res.json({ success: true, message: 'Smart Canteen API is running' }));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
