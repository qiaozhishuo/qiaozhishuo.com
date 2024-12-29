const path = require('path');
const winston = require('winston');

// Configure logging
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/security.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

// Security configurations
const securityConfig = {
    // Rate limiting
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: process.env.NODE_ENV === 'production' ? 100 : 1000,
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false
    },

    // CORS options
    cors: {
        origin: process.env.NODE_ENV === 'production'
            ? ['https://qiaozhishuo.com', 'https://www.qiaozhishuo.com']
            : '*',
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        maxAge: 86400,
        credentials: true
    },

    // Session configuration
    session: {
        secret: process.env.SESSION_SECRET,
        name: 'sessionId',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            domain: process.env.NODE_ENV === 'production' ? '.qiaozhishuo.com' : undefined
        }
    },

    // Content Security Policy
    csp: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "cdnjs.cloudflare.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    },

    // Allowed file types
    allowedFileTypes: ['.md', '.json', '.js', '.css', '.html'],

    // Validate file path
    validateFilePath: (filePath) => {
        const normalizedPath = path.normalize(filePath);
        const contentDir = path.join(__dirname, '..', 'content');
        return normalizedPath.startsWith(contentDir);
    },

    // Security headers
    headers: {
        'X-Frame-Options': 'SAMEORIGIN',
        'X-XSS-Protection': '1; mode=block',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer-when-downgrade',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    }
};

// Security logging function
const logSecurityEvent = (event) => {
    logger.info('Security Event', { ...event, timestamp: new Date().toISOString() });
};

module.exports = {
    securityConfig,
    logger,
    logSecurityEvent
}; 