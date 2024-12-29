const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const matter = require('gray-matter');

// Content directories to watch
const contentDirs = ['news', 'blog', 'media'].map(dir => path.join('content', dir));

// Initialize watcher
const watcher = chokidar.watch(contentDirs, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: false,
    awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
    }
});

// Watch for file changes
console.log('Content watcher started. Monitoring for changes...');

watcher
    .on('add', handleFileChange)
    .on('change', handleFileChange)
    .on('unlink', handleFileDelete);

// Handle file changes (add/modify)
async function handleFileChange(filePath) {
    if (!filePath.endsWith('.md')) return;
    
    const dirName = path.dirname(filePath);
    const contentType = dirName.split(path.sep).pop(); // 'news', 'blog', or 'media'
    const indexPath = path.join(dirName, 'index.json');
    
    try {
        console.log(`Processing ${contentType} file: ${filePath}`);
        
        // Read and parse the markdown file
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const { data: frontMatter, content } = matter(fileContent);
        
        // Extract sections from the content
        const sections = extractSections(content);
        
        // Read current index
        let index = [];
        if (fs.existsSync(indexPath)) {
            const indexContent = fs.readFileSync(indexPath, 'utf8');
            index = JSON.parse(indexContent);
        }
        
        // Remove existing entries for this file
        index = index.filter(item => item.file !== path.basename(filePath));
        
        // Add new entries for each section
        sections.forEach((section, idx) => {
            const title = section.title || frontMatter.title || 'Untitled';
            const preview = section.preview || section.content.substring(0, 150) + '...';
            
            index.push({
                id: generateId(title),
                title: title,
                date: frontMatter.date || new Date().toISOString().split('T')[0],
                preview: preview,
                file: path.basename(filePath),
                section: section.number,
                tags: frontMatter.tags || []
            });
        });
        
        // Sort by date descending
        index.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Write updated index
        fs.writeFileSync(indexPath, JSON.stringify(index, null, 4));
        console.log(`Updated ${contentType} index with ${sections.length} entries`);
        
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error);
    }
}

// Handle file deletion
function handleFileDelete(filePath) {
    if (!filePath.endsWith('.md')) return;
    
    const dirName = path.dirname(filePath);
    const indexPath = path.join(dirName, 'index.json');
    
    try {
        if (fs.existsSync(indexPath)) {
            const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
            const updatedIndex = index.filter(item => item.file !== path.basename(filePath));
            fs.writeFileSync(indexPath, JSON.stringify(updatedIndex, null, 4));
            console.log(`Removed entries for ${filePath} from index`);
        }
    } catch (error) {
        console.error(`Error handling deletion of ${filePath}:`, error);
    }
}

// Extract sections from markdown content
function extractSections(content) {
    const sections = [];
    const lines = content.split('\n');
    let currentSection = { content: '', number: '' };
    let inSection = false;
    
    lines.forEach(line => {
        // Check for section header (## N. Title)
        const sectionMatch = line.match(/^##\s+(\d+)\.\s+(.+)$/);
        
        if (sectionMatch) {
            // Save previous section if exists
            if (currentSection.content) {
                sections.push(processSectionContent(currentSection));
            }
            
            // Start new section
            currentSection = {
                number: sectionMatch[1],
                title: sectionMatch[2],
                content: '',
                preview: ''
            };
            inSection = true;
        } else if (inSection) {
            // Check for video description or preview
            if (line.startsWith('**Video Description**:')) {
                currentSection.preview = line.replace('**Video Description**:', '').trim();
            } else {
                currentSection.content += line + '\n';
            }
        }
    });
    
    // Add last section
    if (currentSection.content) {
        sections.push(processSectionContent(currentSection));
    }
    
    return sections;
}

// Process section content
function processSectionContent(section) {
    // Clean up content
    section.content = section.content.trim();
    
    // If no explicit preview was found in Video Description,
    // use the first paragraph as preview
    if (!section.preview) {
        const firstParagraph = section.content.split('\n\n')[0];
        section.preview = firstParagraph.replace(/\*\*/g, '').substring(0, 150) + '...';
    }
    
    return section;
}

// Generate URL-friendly ID from title
function generateId(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
} 