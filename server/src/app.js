import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';

import env from './config/env.js';
import routes from './routes/index.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.set('trust proxy', 1);

/* ─── Security & infrastructure middleware ─── */
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: [env.clientUrl, 'http://localhost:5173', 'https://evently-five-ivory.vercel.app'],
    credentials: true,
  }),
);
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());
if (!env.isProd) app.use(morgan('dev'));

/* ─── API ─── */
/* Dynamic data — tell the browser never to cache, so we always get a 200
   on the wire instead of a 304 served from a stale cache. */
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
}, apiLimiter, routes);

app.get('/', (_req, res) =>
  res.json({ name: 'Bookify API', version: '1.0.0', docs: '/api/health' }),
);

/* ─── Fallthrough handlers ─── */
app.use(notFound);
app.use(errorHandler);

export default app;
