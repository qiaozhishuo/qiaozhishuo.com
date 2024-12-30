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

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "cdnjs.cloudflare.com", "cdn.jsdelivr.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "http://localhost:3000", "https://qiaozhishuo.com"],
            fontSrc: ["'self'", "cdnjs.cloudflare.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://qiaozhishuo.com', 'https://www.qiaozhishuo.com']
        : '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
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
    logger.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    console.log(`Server running on port ${PORT}`);
}); 