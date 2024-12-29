// Get browser language
function getBrowserLanguage() {
    const language = navigator.language || navigator.userLanguage;
    return language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

// Set initial language based on browser
const currentLang = getBrowserLanguage();
document.documentElement.lang = currentLang;

// Main JavaScript functionality
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for i18next to be initialized
    await i18next.init({
        lng: getBrowserLanguage(),
        debug: false,
        resources: {
            en: {
                translation: translations.en
            },
            zh: {
                translation: translations.zh
            }
        }
    });

    // Update initial content
    updateContent();
    
    // Initialize content loaders
    loadNewsArticles();
    updateVisitorCount();
});

// Function to update content
function updateContent() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.innerHTML = i18next.t(key);
    });
    
    // Reload news articles when language changes
    loadNewsArticles();
}

// Language switcher event listeners
document.addEventListener('DOMContentLoaded', () => {
    const langSwitch = document.querySelector('.lang-switch');
    if (langSwitch) {
        langSwitch.addEventListener('click', () => {
            const newLang = document.documentElement.lang === 'en' ? 'zh' : 'en';
            document.documentElement.lang = newLang;
            i18next.changeLanguage(newLang).then(() => {
                updateContent();
                // Update the language switch button text
                const currentLangSpan = langSwitch.querySelector('.current-lang');
                if (currentLangSpan) {
                    currentLangSpan.textContent = newLang.toUpperCase();
                }
            });
        });
    }
});

// Load blog posts from markdown files
async function loadBlogPosts() {
    try {
        const response = await fetch('/content/blog/index.json');
        const posts = await response.json();
        const blogContainer = document.getElementById('blogGrid');
        
        if (!posts.length) {
            blogContainer.innerHTML = '<div class="no-content">No blog posts available yet.</div>';
            return;
        }
        
        for (const post of posts) {
            const article = createPreviewElement(post, 'blog');
            blogContainer.appendChild(article);
        }
    } catch (error) {
        console.error('Error loading blog posts:', error);
        document.getElementById('blogGrid').innerHTML = '<div class="no-content">Unable to load blog posts.</div>';
    }
}

// Load news articles from markdown files
async function loadNewsArticles() {
    try {
        const response = await fetch('/content/news/index.json');
        if (!response.ok) {
            throw new Error('Failed to fetch news index');
        }
        const articles = await response.json();
        const newsContainer = document.getElementById('newsGrid');
        
        if (!newsContainer) {
            console.error('News container not found');
            return;
        }
        
        if (!articles || !articles.length) {
            newsContainer.innerHTML = '<div class="no-content">No news articles available yet.</div>';
            return;
        }
        
        // Get current language
        const currentLang = document.documentElement.lang || 'en';
        console.log('Current language:', currentLang);
        
        // Filter articles based on language
        const filteredArticles = articles.filter(article => {
            return currentLang === 'zh' ? article.id.endsWith('-zh') : !article.id.endsWith('-zh');
        });
        
        console.log('Filtered articles:', filteredArticles);
        
        // Clear existing content
        newsContainer.innerHTML = '';
        
        // Create and append article elements
        filteredArticles.forEach(article => {
            const articleElement = document.createElement('article');
            articleElement.className = 'content-card';
            
            // Format date
            const date = new Date(article.date + '-01').toLocaleDateString(
                currentLang === 'zh' ? 'zh-CN' : 'en-US',
                { year: 'numeric', month: 'long' }
            );
            
            articleElement.innerHTML = `
                <h3>${article.title}</h3>
                <div class="meta">
                    <span class="date"><i class="far fa-calendar"></i> ${date}</span>
                    ${article.category ? `<span class="category"><i class="fas fa-folder"></i> ${article.category}</span>` : ''}
                </div>
                <p class="preview">${article.description}</p>
                <a href="article.html?type=news&id=${article.id}" class="read-more">
                    ${currentLang === 'zh' ? '阅读更多' : 'Read More'} <i class="fas fa-arrow-right"></i>
                </a>
            `;
            
            newsContainer.appendChild(articleElement);
        });
    } catch (error) {
        console.error('Error loading news articles:', error);
        const newsContainer = document.getElementById('newsGrid');
        if (newsContainer) {
            newsContainer.innerHTML = '<div class="error">Unable to load news articles: ' + error.message + '</div>';
        }
    }
}

// Load media gallery items
async function loadMediaGallery() {
    try {
        const response = await fetch('/content/media/index.json');
        const mediaItems = await response.json();
        const galleryContainer = document.getElementById('mediaGrid');
        
        if (!mediaItems.length) {
            galleryContainer.innerHTML = '<div class="no-content">No media items available yet.</div>';
            return;
        }
        
        mediaItems.forEach(item => {
            const mediaElement = createMediaElement(item);
            galleryContainer.appendChild(mediaElement);
        });
    } catch (error) {
        console.error('Error loading media gallery:', error);
        document.getElementById('mediaGrid').innerHTML = '<div class="no-content">Unable to load media items.</div>';
    }
}

// Create preview element for articles
function createPreviewElement(metadata, type) {
    const article = document.createElement('article');
    article.className = 'content-card';
    
    // Format date
    const date = new Date(metadata.date).toLocaleDateString();
    
    // Create preview HTML
    article.innerHTML = `
        <h3>${metadata.title}</h3>
        <div class="meta">
            <span class="date"><i class="far fa-calendar"></i> ${date}</span>
            ${metadata.category ? `<span class="category"><i class="fas fa-folder"></i> ${metadata.category}</span>` : ''}
        </div>
        <p class="preview">${metadata.description || 'Click to read more...'}</p>
        <a href="article.html?type=${type}&id=${metadata.id}" class="read-more">
            Read More <i class="fas fa-arrow-right"></i>
        </a>
    `;
    
    return article;
}

// Create media element for gallery items
function createMediaElement(item) {
    const div = document.createElement('div');
    div.className = 'media-item content-card';
    
    let content = '';
    if (item.type === 'image') {
        content = `
            <div class="media-preview">
                <img src="${item.url}" alt="${item.title}" loading="lazy" onclick="openLightbox(this)">
            </div>
        `;
    } else if (item.type === 'video') {
        content = `
            <div class="media-preview">
                <video src="${item.url}" controls></video>
            </div>
        `;
    }
    
    div.innerHTML = `
        ${content}
        <div class="media-caption">
            <h3>${item.title}</h3>
            ${item.description ? `<p>${item.description}</p>` : ''}
        </div>
    `;
    
    return div;
}

// Handle navigation
document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href.startsWith('#')) {
            e.preventDefault();
            const targetId = href.substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                window.scrollTo({
                    top: targetSection.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        }
    });
});

// Function to update visitor count
async function updateVisitorCount() {
    try {
        const response = await fetch('/visitor-count');
        const data = await response.json();
        
        const lang = document.documentElement.lang || 'en';
        
        // Update total visitors
        const totalElement = document.getElementById('totalVisitors');
        if (totalElement) {
            totalElement.textContent = data.total;
        }
        
        // Update today's visitors
        const todayElement = document.getElementById('todayVisitors');
        if (todayElement) {
            todayElement.textContent = data.today;
        }
        
        // Update this month's visitors
        const monthElement = document.getElementById('monthVisitors');
        if (monthElement) {
            monthElement.textContent = data.thisMonth;
        }
    } catch (error) {
        console.error('Error updating visitor count:', error);
        ['totalVisitors', 'todayVisitors', 'monthVisitors'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = '-';
            }
        });
    }
}

// Update visitor count on page load
document.addEventListener('DOMContentLoaded', updateVisitorCount);

// Update visitor count periodically
setInterval(updateVisitorCount, 60000); // Update every minute 