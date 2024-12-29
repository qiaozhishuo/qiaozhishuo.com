# QiaoZhiShuo.com

A modern, AI-powered personal website built with Node.js and Express, featuring multi-language support and dynamic content loading.

## Features

- 🌐 Multi-language support (English/Chinese)
- 📱 Responsive design with modern UI/UX
- 📊 Visitor counting system
- 📝 Dynamic content loading
- ✨ Markdown article support
- 🔄 Automatic language detection
- 🎨 Beautiful animations and transitions

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- A reverse proxy (recommended: Nginx) for production deployment

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/qiaozhishuo/qiaozhishuo.com.git
cd qiaozhishuo.com
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The site will be available at `http://localhost:3000`

## Project Structure

```
.
├── content/              # Content files (markdown)
│   ├── blog/
│   ├── news/
│   └── media/
├── css/                 # Stylesheets
├── js/                  # JavaScript files
├── nginx/              # Nginx configuration samples
└── deploy/             # Deployment scripts
```

## Configuration

1. Create a `.env` file in the root directory:
```env
PORT=3000
NODE_ENV=development
```

2. Configure your domain in the Nginx configuration:
- Copy `nginx/sample.conf` to create your own configuration
- Replace `your-domain.com` with your actual domain
- Update SSL certificate paths

## Production Deployment

1. Set up SSL certificates (recommended: Let's Encrypt):
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

2. Configure Nginx:
- Use the sample configuration in `nginx/sample.conf` as a template
- Update domain names and SSL certificate paths

3. Start the application:
```bash
npm start
```

## Security Considerations

1. Never commit sensitive information:
- SSL certificates
- Environment variables
- Server configurations
- API keys

2. Use secure headers (already configured in Nginx sample)
3. Keep dependencies updated
4. Use HTTPS in production
5. Implement rate limiting for API endpoints

## Content Management

### Adding News Articles

1. Create markdown files in `content/news/`
2. Update `content/news/index.json`
3. Support both English and Chinese versions

### File Naming Convention

- English version: `article-name.md`
- Chinese version: `article-name-zh.md`

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - See [LICENSE](LICENSE) for details

## Support

For support, please open an issue in the GitHub repository. 