import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// Route imports
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import sellerRoutes from './routes/seller.routes';
import buyerRoutes from './routes/buyer.routes';
import listingRoutes from './routes/listing.routes';
import orderRoutes from './routes/order.routes';
import mapRoutes from './routes/map.routes';
import priceRoutes from './routes/price.routes';
import adminRoutes from './routes/admin.routes';
import statsRoutes from './routes/stats.routes';
import notificationRoutes from './routes/notification.routes';

const app = express();

// ── Security middleware ────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,  // Allow dev tools; tighten in prod
}));

app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Global rate limiter ────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please try again later.' },
});
app.use('/api', globalLimiter);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Request logging ───────────────────────────────────────────────────────────
app.use(requestLogger);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'biochain-api' });
});

// ── API routes ────────────────────────────────────────────────────────────────
const V1 = '/api/v1';
app.use(`${V1}/auth`, authRoutes);
app.use(`${V1}/users`, userRoutes);
app.use(`${V1}/seller`, sellerRoutes);
app.use(`${V1}/buyer`, buyerRoutes);
app.use(`${V1}/listings`, listingRoutes);
app.use(`${V1}/orders`, orderRoutes);
app.use(`${V1}/map`, mapRoutes);
app.use(`${V1}/prices`, priceRoutes);
app.use(`${V1}/admin`, adminRoutes);
app.use(`${V1}/stats`, statsRoutes);
app.use(`${V1}/notifications`, notificationRoutes);

// ── Error handling ────────────────────────────────────────────────────────────
app.use(errorHandler);

const PORT = env.PORT;
app.listen(PORT, () => {
  console.log(`🌿 BioChain API running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${env.NODE_ENV}`);
});

export default app;
