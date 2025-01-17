// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const winston = require('winston');

// Create logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});

const app = express();

// Trust proxy - required for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Default allowed origins
const defaultAllowedOrigins = ['http://localhost:3000'];

// Parse allowed origins from environment variable or use default
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',')
    : defaultAllowedOrigins;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 
                       "cdnjs.cloudflare.com", "cdn.jsdelivr.net"].filter(Boolean),
            styleSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", ...allowedOrigins],
            fontSrc: ["'self'", "cdnjs.cloudflare.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
            upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false
}));

// Rate limiting configuration
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 500, // Increased from 100 to 500 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.',
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many requests, please try again later.'
        });
    }
});

// Apply rate limiting to all routes
app.use(limiter);

// Create a more lenient limiter for static content
const staticLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000, // Allow more requests for static content
    message: {
        status: 429,
        error: 'Too many requests',
        message: 'Too many requests for static content, please try again in 15 minutes'
    }
});

// Apply the more lenient limiter to static content
app.use('/static', staticLimiter, express.static('public'));
app.use('/images', staticLimiter, express.static('images'));
app.use('/css', staticLimiter, express.static('css'));
app.use('/js', staticLimiter, express.static('js'));

// API specific rate limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300, // Specific limit for API endpoints
    message: {
        status: 429,
        error: 'Too many API requests',
        message: 'Too many API requests, please try again in 15 minutes'
    }
});

// Apply API rate limiter to API routes
app.use('/api', apiLimiter);

// CORS configuration
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? allowedOrigins
        : '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));

// Request logging
app.use(morgan('combined', {
    stream: fs.createWriteStream(path.join(__dirname, 'logs/access.log'), { flags: 'a' })
}));

// Serve static files from root directory
app.use(express.static(__dirname));

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Article request handler
app.get('/article/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        
        // Input validation
        if (!type || !id) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        
        // Get article metadata
        const indexPath = path.join(__dirname, 'content', type, 'index.json');
        const indexContent = await fs.promises.readFile(indexPath, 'utf8');
        const articles = JSON.parse(indexContent);
        
        const article = articles.find(a => a.id === id);
        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }
        
        // Get article content
        const filePath = path.join(__dirname, 'content', type, article.file);
        const content = await fs.promises.readFile(filePath, 'utf8');
        
        res.json({
            title: article.title,
            date: article.date,
            content: content,
            translations: article.translations || {}
        });
    } catch (error) {
        logger.error('Error serving article:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Initialize visitor counts
const visitorCounts = {
    total: 0,
    today: 0,
    thisMonth: 0,
    lastReset: new Date()
};

// Load visitor counts from file if exists
try {
    if (fs.existsSync('data/visitor-counts.json')) {
        const data = fs.readFileSync('data/visitor-counts.json', 'utf8');
        Object.assign(visitorCounts, JSON.parse(data));
    }
} catch (error) {
    logger.error('Error loading visitor counts:', error);
}

// Save visitor counts periodically
setInterval(() => {
    try {
        if (!fs.existsSync('data')) {
            fs.mkdirSync('data');
        }
        fs.writeFileSync('data/visitor-counts.json', JSON.stringify(visitorCounts));
    } catch (error) {
        logger.error('Error saving visitor counts:', error);
    }
}, 5 * 60 * 1000); // Save every 5 minutes

// Reset daily and monthly counts
function resetCounts() {
    const now = new Date();
    const lastReset = new Date(visitorCounts.lastReset);

    // Reset daily count if it's a new day
    if (now.getDate() !== lastReset.getDate()) {
        visitorCounts.today = 0;
    }

    // Reset monthly count if it's a new month
    if (now.getMonth() !== lastReset.getMonth()) {
        visitorCounts.thisMonth = 0;
    }

    visitorCounts.lastReset = now;
}

// Visitor count endpoint
app.get('/visitor-count', (req, res) => {
    try {
        resetCounts();
        visitorCounts.total++;
        visitorCounts.today++;
        visitorCounts.thisMonth++;
        
        res.json({
            total: visitorCounts.total,
            today: visitorCounts.today,
            thisMonth: visitorCounts.thisMonth
        });
    } catch (error) {
        logger.error('Error updating visitor count:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    if (err instanceof Error) {
        if (err.name === 'RateLimitExceeded') {
            return res.status(429).json({
                status: 'error',
                message: 'Rate limit exceeded. Please try again later.',
                retryAfter: err.resetTime ? Math.ceil(err.resetTime / 1000 - Date.now() / 1000) : 900
            });
        }
    }
    next(err);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    console.log(`Server running on port ${PORT}`);
}); 