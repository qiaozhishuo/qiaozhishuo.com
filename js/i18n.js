// Initialize i18next
i18next.init({
    lng: 'en', // default language
    debug: false,
    resources: {
        en: {
            translation: {
                nav: {
                    news: "News",
                    blog: "Blog",
                    contact: "Contact",
                    language: "EN"
                },
                home: {
                    title: "AI Enthusiast & Tech Visionary",
                    tag1: "AI Enthusiast",
                    tag2: "Tech Geek",
                    tag3: "TSLA Holder",
                    tag4: "Tesla Owner",
                    description: "Shaping Tomorrow's World with AI – Where Innovation Knows No Bounds",
                    purpose: "Dedicated to sharing insights on AI advancement, exploring how artificial intelligence can enhance human potential, and following Tesla's revolutionary journey in shaping our future",
                    feature1: {
                        title: "AI Insights",
                        desc: "Exploring the latest in AI technology and its impact on our future"
                    },
                    feature2: {
                        title: "Personal Growth",
                        desc: "Leveraging AI to enhance human potential and capabilities"
                    },
                    feature3: {
                        title: "Tesla Journey",
                        desc: "Following Tesla's innovation and technological breakthroughs"
                    }
                },
                sections: {
                    news: "Latest News",
                    blog: "Blog",
                    contact: "Contact"
                },
                contact: {
                    title: "Follow & Connect",
                    description: "Get in touch with us for collaborations, inquiries, or just to say hello."
                },
                stats: {
                    total: "Total Visits",
                    today: "Today",
                    month: "This Month"
                },
                footer: {
                    name: "QiaoZhiShuo",
                    rights: "All rights reserved."
                }
            }
        },
        zh: {
            translation: {
                nav: {
                    news: "新闻",
                    blog: "博客",
                    contact: "联系",
                    language: "中文"
                },
                home: {
                    title: "AI爱好者 & 科技先驱",
                    tag1: "AI爱好者",
                    tag2: "科技极客",
                    tag3: "TSLA投资者",
                    tag4: "Tesla车主",
                    description: "用AI塑造明天的世界 – 创新无止境",
                    purpose: "致力于分享AI发展见解，探索人工智能如何提升人类潜能，并关注Tesla在塑造未来过程中的革命性进程",
                    feature1: {
                        title: "AI洞察",
                        desc: "探索AI技术的最新发展及其对未来的影响"
                    },
                    feature2: {
                        title: "个人成长",
                        desc: "利用AI提升人类潜能和能力"
                    },
                    feature3: {
                        title: "特斯拉之旅",
                        desc: "关注Tesla的创新和技术突破"
                    }
                },
                sections: {
                    news: "最新新闻",
                    blog: "博客文章",
                    contact: "联系方式"
                },
                contact: {
                    title: "关注 & 联系",
                    description: "欢迎联系我们进行合作、咨询或打个招呼。"
                },
                stats: {
                    total: "总访问量",
                    today: "今日访问",
                    month: "本月访问"
                },
                footer: {
                    name: "乔智说",
                    rights: "版权所有"
                }
            }
        }
    }
});

// Function to toggle language
function toggleLanguage() {
    const currentLang = i18next.language;
    const newLang = currentLang === 'en' ? 'zh' : 'en';
    i18next.changeLanguage(newLang, (err, t) => {
        if (err) return console.error('Error changing language:', err);
        updateContent();
    });
}

// Function to update content based on current language
function updateContent() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = i18next.t(key);
    });
    document.documentElement.lang = i18next.language;
} 