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

// Security middleware
app.use(helmet());

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

// Serve static files
app.use(express.static('public'));

// Article request handler
app.get('/api/article', async (req, res) => {
    try {
        const { type, id } = req.query;
        
        // Input validation
        if (!type || !id) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        
        // Sanitize input
        const sanitizedType = type.replace(/[^a-zA-Z0-9-]/g, '');
        const sanitizedId = id.replace(/[^a-zA-Z0-9-]/g, '');
        
        // Get article metadata
        const indexPath = path.join(__dirname, 'content', sanitizedType, 'index.json');
        const indexContent = await fs.promises.readFile(indexPath, 'utf8');
        const articles = JSON.parse(indexContent);
        
        const article = articles.find(a => a.id === sanitizedId);
        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }
        
        // Get article content
        const filePath = path.join(__dirname, 'content', sanitizedType, article.file);
        const content = await fs.promises.readFile(filePath, 'utf8');
        
        res.json({
            metadata: article,
            content
        });
    } catch (error) {
        logger.error('Error serving article:', error);
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