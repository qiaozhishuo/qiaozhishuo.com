// Translations
const translations = {
    en: {
        nav: {
            home: 'Home',
            news: 'News',
            blog: 'Blog',
            media: 'Media',
            contact: 'Contact',
            visitors: 'Visitors'
        },
        home: {
            title: 'AI Enthusiast & Tech Visionary',
            tag1: 'AI Enthusiast',
            tag2: 'Tech Geek',
            tag3: 'TSLA Holder',
            tag4: 'Tesla Owner',
            description: "Shaping Tomorrow's World with AI – Where Innovation Knows No Bounds.",
            purpose: "Dedicated to sharing insights on AI advancement, exploring how artificial intelligence can enhance human potential, and following Tesla's revolutionary journey in shaping our future.",
            feature1: {
                title: 'AI Insights',
                desc: 'Exploring the latest in AI technology and its impact on our future'
            },
            feature2: {
                title: 'Personal Growth',
                desc: 'Leveraging AI to enhance human potential and capabilities'
            },
            feature3: {
                title: 'Tesla Journey',
                desc: "Following Tesla's innovation and technological breakthroughs"
            }
        },
        news: {
            title: 'Latest News'
        },
        blog: {
            title: 'Blog Posts'
        },
        media: {
            title: 'Media Gallery'
        },
        contact: {
            title: 'Follow & Connect'
        },
        footer: {
            name: 'QiaoZhiShuo',
            rights: 'All rights reserved.',
            totalVisitors: 'Total Visitors',
            todayVisitors: 'Today',
            monthVisitors: 'This Month'
        }
    },
    zh: {
        nav: {
            home: '首页',
            news: '新闻',
            blog: '博客',
            media: '媒体',
            contact: '联系',
            visitors: '访客数'
        },
        home: {
            title: 'AI爱好者 & 科技先驱',
            tag1: 'AI爱好者',
            tag2: '科技极客',
            tag3: 'TSLA投资者',
            tag4: 'Tesla车主',
            description: '用AI塑造明天的世界 – 创新无止境',
            purpose: '致力于分享AI发展见解，探索人工智能如何提升个体潜能，关注Tesla在塑造未来过程中的革命性进程。',
            feature1: {
                title: 'AI洞察',
                desc: '探索AI技术的最新发展及其对未来的影响'
            },
            feature2: {
                title: '个人成长',
                desc: '利用AI提升人类潜能和能力'
            },
            feature3: {
                title: '特斯拉之旅',
                desc: '关注Tesla的创新和技术突破'
            }
        },
        news: {
            title: '最新新闻'
        },
        blog: {
            title: '博客文章'
        },
        media: {
            title: '媒体库'
        },
        contact: {
            title: '关注与联系'
        },
        footer: {
            name: '乔智说',
            rights: '版权所有。',
            totalVisitors: '总访问量',
            todayVisitors: '今日',
            monthVisitors: '本月'
        }
    }
};

// Language switcher functionality
class I18n {
    constructor() {
        this.currentLang = localStorage.getItem('language') || 'en';
        this.init();
    }

    init() {
        // Initialize language
        this.setLanguage(this.currentLang);

        // Add event listener to language switch button
        const langSwitch = document.getElementById('langSwitch');
        if (langSwitch) {
            langSwitch.addEventListener('click', () => {
                this.toggleLanguage();
            });
        }
    }

    setLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('language', lang);
        
        // Update button text
        const currentLangElement = document.querySelector('.current-lang');
        if (currentLangElement) {
            currentLangElement.textContent = lang.toUpperCase();
        }

        // Update all translations
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const keys = element.getAttribute('data-i18n').split('.');
            let value = translations[lang];
            for (const key of keys) {
                value = value[key];
            }
            element.textContent = value;
        });

        // Update document language
        document.documentElement.lang = lang;
    }

    toggleLanguage() {
        const newLang = this.currentLang === 'en' ? 'zh' : 'en';
        this.setLanguage(newLang);
    }

    // Helper method to get a translation
    t(key) {
        const keys = key.split('.');
        let value = translations[this.currentLang];
        for (const k of keys) {
            value = value[k];
        }
        return value;
    }
}

// Initialize translations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.i18n = new I18n();
}); 