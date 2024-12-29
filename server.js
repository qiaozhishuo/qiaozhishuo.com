const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000; // Default to 3000 for development

// Enable CORS
app.use(cors());

// Serve static files
app.use(express.static(path.join(__dirname)));

// Initialize visitor stats file if it doesn't exist
const visitorStatsPath = path.join(__dirname, 'visitor-stats.json');
if (!fs.existsSync(visitorStatsPath)) {
    fs.writeFileSync(visitorStatsPath, JSON.stringify({
        totalVisitors: 0,
        uniqueVisitors: [],
        dailyStats: {},
        monthlyStats: {}
    }));
}

// Helper function to get real IP address
function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0].trim() || 
           req.headers['x-real-ip'] || 
           req.ip || 
           req.connection.remoteAddress;
}

// Helper function to get today's date key
function getTodayKey() {
    return new Date().toISOString().split('T')[0];
}

// Helper function to get current month key
function getMonthKey() {
    return new Date().toISOString().slice(0, 7);
}

// Visitor tracking middleware
app.use((req, res, next) => {
    if (!req.path.includes('.') && !req.path.includes('/visitor-count')) {
        try {
            const stats = JSON.parse(fs.readFileSync(visitorStatsPath, 'utf8'));
            const clientIP = getClientIP(req);
            const today = getTodayKey();
            const month = getMonthKey();
            const userAgent = req.headers['user-agent'];
            
            // Initialize stats objects if they don't exist
            stats.dailyStats[today] = stats.dailyStats[today] || 0;
            stats.monthlyStats[month] = stats.monthlyStats[month] || 0;
            
            // Check if this is a new unique visitor
            const visitorInfo = {
                ip: clientIP,
                userAgent: userAgent,
                firstVisit: new Date().toISOString()
            };
            
            const isNewVisitor = !stats.uniqueVisitors.some(v => v.ip === clientIP);
            
            if (isNewVisitor) {
                stats.uniqueVisitors.push(visitorInfo);
                stats.totalVisitors++;
                stats.dailyStats[today]++;
                stats.monthlyStats[month]++;
                
                // Clean up old daily stats (keep last 30 days)
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                Object.keys(stats.dailyStats).forEach(date => {
                    if (new Date(date) < thirtyDaysAgo) {
                        delete stats.dailyStats[date];
                    }
                });
                
                fs.writeFileSync(visitorStatsPath, JSON.stringify(stats, null, 2));
            }
        } catch (error) {
            console.error('Error tracking visitor:', error);
        }
    }
    next();
});

// Enhanced endpoint to get visitor statistics
app.get('/visitor-count', (req, res) => {
    try {
        const stats = JSON.parse(fs.readFileSync(visitorStatsPath, 'utf8'));
        const today = getTodayKey();
        const month = getMonthKey();
        
        res.json({
            total: stats.totalVisitors,
            today: stats.dailyStats[today] || 0,
            thisMonth: stats.monthlyStats[month] || 0,
            dailyStats: stats.dailyStats,
            monthlyStats: stats.monthlyStats
        });
    } catch (error) {
        console.error('Error getting visitor stats:', error);
        res.status(500).json({ error: 'Error getting visitor statistics' });
    }
});

// Handle article requests
app.get('/article/:type/:id', async (req, res) => {
    const { type, id } = req.params;
    
    try {
        // First try to find the article metadata in the index
        const indexPath = path.join(__dirname, 'content', type, 'index.json');
        if (!fs.existsSync(indexPath)) {
            return res.status(404).json({ error: 'Article type not found' });
        }
        
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        const articles = JSON.parse(indexContent);
        
        const articleMeta = articles.find(article => article.id === id);
        if (!articleMeta) {
            return res.status(404).json({ error: 'Article not found' });
        }
        
        // Read the article content
        const articlePath = path.join(__dirname, 'content', type, articleMeta.file);
        if (!fs.existsSync(articlePath)) {
            return res.status(404).json({ error: 'Article file not found' });
        }
        
        const content = fs.readFileSync(articlePath, 'utf8');
        
        // Return both metadata and content
        res.json({
            ...articleMeta,
            content: content
        });
    } catch (error) {
        console.error('Error serving article:', error);
        res.status(500).json({ error: 'Error serving article: ' + error.message });
    }
});

// Serve index.json files
app.get('/content/:type/index.json', (req, res) => {
    const { type } = req.params;
    const indexPath = path.join(__dirname, 'content', type, 'index.json');
    
    try {
        if (!fs.existsSync(indexPath)) {
            return res.status(404).json([]);
        }
        const content = fs.readFileSync(indexPath, 'utf8');
        res.json(JSON.parse(content));
    } catch (error) {
        console.error('Error serving index:', error);
        res.status(500).json({ error: 'Error serving index' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Catch-all route to serve index.html for client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server with error handling
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
    console.log('Available endpoints:');
    console.log('- / (static files)');
    console.log('- /article/:type/:id (article content)');
    console.log('- /visitor-count (visitor statistics)');
}).on('error', (err) => {
    if (err.code === 'EACCES') {
        console.error(`Error: Port ${PORT} requires elevated privileges`);
    } else if (err.code === 'EADDRINUSE') {
        console.error(`Error: Port ${PORT} is already in use`);
    } else {
        console.error('Error starting server:', err);
    }
    process.exit(1);
}); 