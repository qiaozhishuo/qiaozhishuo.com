// Wait for marked to be available
document.addEventListener('DOMContentLoaded', () => {
    if (typeof marked === 'undefined') {
        console.error('Marked library not loaded');
        return;
    }

    // Configure marked options
    marked.setOptions({
        gfm: true, // GitHub Flavored Markdown
        breaks: true, // Convert line breaks to <br>
        headerIds: true, // Add ids to headers
        mangle: false, // Don't escape HTML
        sanitize: false, // Don't sanitize HTML
        smartLists: true, // Use smarter list behavior
        smartypants: true, // Use smart punctuation
        xhtml: false, // Don't use XHTML
        highlight: function(code, lang) {
            // Add syntax highlighting if available
            if (window.hljs && lang) {
                try {
                    return hljs.highlight(code, { language: lang }).value;
                } catch (e) {
                    console.warn('Language not supported:', lang);
                    return code;
                }
            }
            return code;
        }
    });

    // Custom renderer
    const renderer = new marked.Renderer();

    // Custom image rendering with lazy loading and lightbox
    renderer.image = function(href, title, text) {
        return `<img src="${href}" alt="${text}" title="${title || ''}" loading="lazy" onclick="openLightbox(this)">`;
    };

    // Custom link rendering with external link handling
    renderer.link = function(href, title, text) {
        const isExternal = href.startsWith('http') && !href.includes(window.location.hostname);
        const attrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<a href="${href}" title="${title || ''}"${attrs}>${text}</a>`;
    };

    // Custom heading rendering with anchor links
    renderer.heading = function(text, level) {
        const slug = text.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        
        return `
            <h${level} id="${slug}">
                ${text}
                <a class="header-anchor" href="#${slug}" aria-hidden="true">#</a>
            </h${level}>
        `;
    };

    // Set custom renderer
    marked.use({ renderer });
});

// Lightbox functionality
function openLightbox(img) {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.onclick = () => lightbox.remove();
    
    const imgClone = document.createElement('img');
    imgClone.src = img.src;
    imgClone.alt = img.alt;
    imgClone.title = img.title;
    
    lightbox.appendChild(imgClone);
    document.body.appendChild(lightbox);
}

// Add lightbox styles
const style = document.createElement('style');
style.textContent = `
    .lightbox {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        cursor: pointer;
    }
    
    .lightbox img {
        max-width: 90%;
        max-height: 90%;
        object-fit: contain;
    }
    
    .header-anchor {
        float: left;
        margin-left: -20px;
        padding-right: 4px;
        opacity: 0;
        text-decoration: none;
        color: var(--secondary-color);
    }
    
    h1:hover .header-anchor,
    h2:hover .header-anchor,
    h3:hover .header-anchor,
    h4:hover .header-anchor,
    h5:hover .header-anchor,
    h6:hover .header-anchor {
        opacity: 1;
    }
`;

document.head.appendChild(style); 