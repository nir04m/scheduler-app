import express from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/error.middleware';
import { apiLimiter } from './middleware/ratelimit.middleware';
import pollRoutes from "./routes/poll.routes"

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors(corsOptions));
app.use(
    express.json({
        limit:'1mb',
    })
);

app.use("/api", apiLimiter);

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Server is running',
    });
});

app.use("/api/polls", pollRoutes);

app.use(errorHandler);

export default app;