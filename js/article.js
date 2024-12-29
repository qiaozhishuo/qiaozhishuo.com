// Article page functionality
document.addEventListener('DOMContentLoaded', () => {
    loadArticle();
});

// Load and display the article
async function loadArticle() {
    try {
        // Get article type and filename from URL parameters
        const params = new URLSearchParams(window.location.search);
        const type = params.get('type');
        const filename = params.get('file');

        if (!type || !filename) {
            throw new Error('Missing article parameters');
        }

        // Load article content and metadata
        const content = await fetch(`/content/${type}/${filename}`).then(res => res.text());
        const metadata = await fetch(`/content/${type}/index.json`)
            .then(res => res.json())
            .then(items => items.find(item => item.file === filename));

        if (!metadata) {
            throw new Error('Article not found');
        }

        // Update page title
        document.title = `${metadata.title} - Personal Website`;

        // Create and display the article
        const article = createArticleElement(content, metadata);
        document.querySelector('.article-container').appendChild(article);

    } catch (error) {
        console.error('Error loading article:', error);
        document.querySelector('.article-container').innerHTML = `
            <div class="error-message">
                <h2>Error Loading Article</h2>
                <p>${error.message}</p>
                <a href="/" class="back-button">Back to Home</a>
            </div>
        `;
    }
}

// Create the article element
function createArticleElement(markdown, metadata) {
    const article = document.createElement('article');
    article.className = 'full-article markdown-content';
    
    // Parse markdown content
    const htmlContent = marked.parse(markdown);
    
    // Format date
    const date = new Date(metadata.date).toLocaleDateString();
    
    // Create article HTML
    article.innerHTML = `
        <h1>${metadata.title}</h1>
        <div class="meta">
            <span class="date">${date}</span>
            ${metadata.author ? `<span class="author">By ${metadata.author}</span>` : ''}
            ${metadata.tags ? `<span class="tags">Tags: ${metadata.tags.join(', ')}</span>` : ''}
        </div>
        <div class="content">${htmlContent}</div>
    `;
    
    return article;
} 