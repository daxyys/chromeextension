class ShippingAgentConverter {
    constructor() {
        this.agents = {
            // Query Parameter Based
            'mycnbox.com': {
                type: 'query',
                patterns: {
                    extract: /[?&]itemId=([^&]+)/,
                    platform: /[?&]mallType=([^&]+)/
                },
                build: (itemId, platform) => `https://mycnbox.com/goodsDetail?mallType=${platform}&itemId=${itemId}`
            },
            'joyagoo.com': {
                type: 'query',
                patterns: {
                    extract: /[?&]id=([^&]+)/,
                    platform: /[?&]shop_type=([^&]+)/
                },
                build: (itemId, platform) => `https://joyagoo.com/product/?id=${itemId}&shop_type=${platform}&ref=300000654`
            },
            'acbuy.com': {
                type: 'query',
                patterns: {
                    extract: /[?&]id=([^&]+)/,
                    platform: /[?&]source=([^&]+)/
                },
                build: (itemId, platform) => `https://www.acbuy.com/product?id=${itemId}&source=${platform}`
            },
            'cnfans.com': {
                type: 'query',
                patterns: {
                    extract: /[?&]id=([^&]+)/,
                    platform: /[?&]platform=([^&]+)/
                },
                build: (itemId, platform) => `https://cnfans.com/product?id=${itemId}&platform=${platform}&ref=131132`
            },
            'mulebuy.com': {
                type: 'query',
                patterns: {
                    extract: /[?&]id=([^&]+)/,
                    platform: /[?&]platform=([^&]+)/
                },
                build: (itemId, platform) => `https://mulebuy.com/product?id=${itemId}&platform=${platform}`
            },
            'lovegobuy.com': {
                type: 'query',
                patterns: {
                    extract: /[?&]id=([^&]+)/,
                    platform: /[?&]shop_type=([^&]+)/
                },
                build: (itemId, platform) => `https://www.lovegobuy.com/product?id=${itemId}&shop_type=${platform}`
            },
            'npbuy.com': {
                type: 'query',
                patterns: {
                    extract: /[?&]itemId=([^&]+)/,
                    platform: /[?&]source=([^&]+)/
                },
                build: (itemId, platform) => `https://www.npbuy.com/goods-detail?itemId=${itemId}&source=${platform}`
            },
            'gtbuy.com': {
                type: 'query',
                patterns: {
                    extract: /[?&]keyword=([^&]+)/,
                    platform: /[?&]platform=([^&]+)/
                },
                build: (itemId, platform) => `https://www.gtbuy.com/goods/detail?keyword=${itemId}&platform=${platform}`
            },
            'ootdbuy.com': {
                type: 'query',
                patterns: {
                    extract: /[?&]id=([^&]+)/,
                    platform: /[?&]channel=([^&]+)/
                },
                build: (itemId, platform) => `https://www.ootdbuy.com/goods/details?id=${itemId}&channel=${platform}`
            },
            'orientdig.com': {
                type: 'query',
                patterns: {
                    extract: /[?&]id=([^&]+)/,
                    platform: /[?&]platform=([^&]+)/
                },
                build: (itemId, platform) => `https://orientdig.com/product?id=${itemId}&platform=${platform}`
            },

            // URL Encoded Based
            'itaobuy.com': {
                type: 'encoded_url',
                patterns: {
                    extract: /[?&]url=([^&]+)/
                },
                build: (originalUrl) => `https://www.itaobuy.com/product-detail?url=${encodeURIComponent(originalUrl)}`
            },
            'allchinabuy.com': {
                type: 'encoded_url',
                patterns: {
                    extract: /[?&]url=([^&]+)/
                },
                build: (originalUrl) => `https://www.allchinabuy.com/en/page/buy/?url=${encodeURIComponent(originalUrl)}`
            },
            'loongbuy.com': {
                type: 'encoded_url',
                patterns: {
                    extract: /[?&]url=([^&]+)/
                },
                build: (originalUrl) => `https://www.loongbuy.com/product-details?url=${originalUrl}`
            },
            'eastmallbuy.com': {
                type: 'encoded_url',
                patterns: {
                    extract: /[?&]url=([^&]+)/
                },
                build: (originalUrl) => `https://www.eastmallbuy.com/index/item/index.html?tp=taobao&tid=&searchlang=en&url=${encodeURIComponent(originalUrl)}`
            },
            'hubbuycn.com': {
                type: 'encoded_url',
                patterns: {
                    extract: /[?&]url=([^&]+)/
                },
                build: (originalUrl) => `https://hubbuycn.com/index/item/index.html?tp=micro&tid=&searchlang=en&url=${encodeURIComponent(originalUrl)}`
            },
            'pantherbuy.com': {
                type: 'encoded_url',
                patterns: {
                    extract: /[?&]url=([^&]+)/
                },
                build: (originalUrl) => `https://pantherbuy.com/index/item/index.html?tp=micro&tid=&searchlang=en&url=${encodeURIComponent(originalUrl)}`
            },

            // Path Based
            'hoobuy.com': {
                type: 'path',
                patterns: {
                    extract: /\/product\/(\d+)\/(\d+)/
                },
                build: (platform, itemId) => `https://hoobuy.com/product/${platform}/${itemId}`
            },
            'basetao.com': {
                type: 'path',
                patterns: {
                    extract: /\/agent\/([^\/]+)\/(\d+)\.html/
                },
                build: (platform, itemId) => `https://www.basetao.com/best-taobao-agent-service/products/agent/${platform}/${itemId}.html`
            },
            'oopbuy.com': {
                type: 'path',
                patterns: {
                    extract: /\/product\/([^\/]+)\/(\d+)/
                },
                build: (platform, itemId) => `https://oopbuy.com/product/${platform}/${itemId}`
            },
            'hipobuy.com': {
                type: 'path',
                patterns: {
                    extract: /\/product\/([^\/]+)\/(\d+)/
                },
                build: (platform, itemId) => `https://hipobuy.com/product/${platform}/${itemId}`
            },
            'yoybuy.com': {
                type: 'special',
                patterns: {
                    extract: /[?&]offerid=([^&]+)/
                },
                build: (itemId) => `https://www.yoybuy.com/p_new/itemdetail1688.html?offerid=${itemId}&locale=en`
            },

            // Known agents from before
            'superbuy.com': {
                type: 'encoded_url',
                patterns: {
                    extract: /[?&]url=([^&]+)/
                },
                build: (originalUrl) => `https://superbuy.com/en/page/buy?url=${encodeURIComponent(originalUrl)}`
            },
            'sugargoo.com': {
                type: 'encoded_url',
                patterns: {
                    extract: /[?&]url=([^&]+)/
                },
                build: (originalUrl) => `https://sugargoo.com/index/item/index.html?tp=taobao&url=${encodeURIComponent(originalUrl)}`
            },
            'cssbuy.com': {
                type: 'path',
                patterns: {
                    extract: /\/item-(\d+)/
                },
                build: (itemId) => `https://cssbuy.com/item-${itemId}`
            }
        };

        this.originalPlatforms = {
            'taobao.com': {
                patterns: {
                    extract: /[?&]id=(\d+)/
                },
                build: (itemId) => `https://item.taobao.com/item.htm?id=${itemId}`
            },
            'tmall.com': {
                patterns: {
                    extract: /[?&]id=(\d+)/
                },
                build: (itemId) => `https://detail.tmall.com/item.htm?id=${itemId}`
            },
            'weidian.com': {
                patterns: {
                    extract: /[?&]itemID=(\d+)/
                },
                build: (itemId) => `https://weidian.com/item.html?itemID=${itemId}`
            },
            '1688.com': {
                patterns: {
                    extract: /\/offer\/(\d+)\.html/
                },
                build: (itemId) => `https://detail.1688.com/offer/${itemId}.html`
            }
        };

        this.platformMappings = {
            'taobao': 'taobao.com',
            'TB': 'taobao.com',
            'tmall': 'tmall.com',
            'weidian': 'weidian.com',
            'WD': 'weidian.com',
            'WEIDIAN': 'weidian.com',
            'micro': 'weidian.com',
            '1688': '1688.com'
        };
    }

    // Extract information from any URL
    parseUrl(url) {
        const domain = this.extractDomain(url);
        
        // Check if it's an original platform
        for (const [platformDomain, config] of Object.entries(this.originalPlatforms)) {
            if (domain.includes(platformDomain)) {
                const match = url.match(config.patterns.extract);
                if (match) {
                    return {
                        type: 'original',
                        platform: platformDomain,
                        itemId: match[1],
                        originalUrl: url
                    };
                }
            }
        }
        
        // Check if it's a shipping agent
        for (const [agentDomain, config] of Object.entries(this.agents)) {
            if (domain.includes(agentDomain)) {
                return this.parseAgentUrl(url, agentDomain, config);
            }
        }
        
        return null;
    }

    parseAgentUrl(url, agentDomain, config) {
        switch (config.type) {
            case 'query':
                const itemMatch = url.match(config.patterns.extract);
                const platformMatch = url.match(config.patterns.platform);
                if (itemMatch && platformMatch) {
                    const platformKey = platformMatch[1];
                    const originalPlatform = this.platformMappings[platformKey] || platformKey;
                    return {
                        type: 'agent',
                        agent: agentDomain,
                        itemId: itemMatch[1],
                        platform: originalPlatform,
                        originalUrl: this.buildOriginalUrl(originalPlatform, itemMatch[1])
                    };
                }
                break;
                
            case 'encoded_url':
                const urlMatch = url.match(config.patterns.extract);
                if (urlMatch) {
                    const decodedUrl = decodeURIComponent(urlMatch[1]);
                    const originalInfo = this.parseUrl(decodedUrl);
                    if (originalInfo) {
                        return {
                            type: 'agent',
                            agent: agentDomain,
                            itemId: originalInfo.itemId,
                            platform: originalInfo.platform,
                            originalUrl: decodedUrl
                        };
                    }
                }
                break;
                
            case 'path':
                const pathMatch = url.match(config.patterns.extract);
                if (pathMatch) {
                    const platform = this.platformMappings[pathMatch[1]] || pathMatch[1];
                    return {
                        type: 'agent',
                        agent: agentDomain,
                        itemId: pathMatch[2],
                        platform: platform,
                        originalUrl: this.buildOriginalUrl(platform, pathMatch[2])
                    };
                }
                break;
        }
        
        return null;
    }

    // Convert any URL to any agent or original platform
    convertUrl(sourceUrl, targetAgent) {
        const parsed = this.parseUrl(sourceUrl);
        if (!parsed) return null;
        
        // Convert to original platform
        if (targetAgent === 'original') {
            return parsed.originalUrl;
        }
        
        // Convert to specific agent
        const agentConfig = this.agents[targetAgent];
        if (!agentConfig) return null;
        
        switch (agentConfig.type) {
            case 'query':
                const platformCode = this.getPlatformCode(parsed.platform, targetAgent);
                return agentConfig.build(parsed.itemId, platformCode);
                
            case 'encoded_url':
                return agentConfig.build(parsed.originalUrl);
                
            case 'path':
                const pathPlatform = this.getPlatformCode(parsed.platform, targetAgent);
                return agentConfig.build(pathPlatform, parsed.itemId);
                
            case 'special':
                return agentConfig.build(parsed.itemId);
        }
        
        return null;
    }

    // Helper methods
    extractDomain(url) {
        try {
            return new URL(url).hostname.toLowerCase();
        } catch {
            return '';
        }
    }

    buildOriginalUrl(platform, itemId) {
        const config = this.originalPlatforms[platform];
        return config ? config.build(itemId) : null;
    }

    getPlatformCode(platform, agent) {
        // Map platform domains back to agent-specific codes
        const mappings = {
            'taobao.com': { default: 'taobao', 'acbuy.com': 'TB' },
            'weidian.com': { default: 'weidian', 'npbuy.com': 'WD', 'cnfans.com': 'WEIDIAN' },
            '1688.com': { default: '1688' },
            'tmall.com': { default: 'tmall' }
        };
        
        const platformMappings = mappings[platform];
        return platformMappings ? (platformMappings[agent] || platformMappings.default) : platform;
    }

    // Batch conversion
    convertBatch(urls, targetAgent) {
        return urls.map(url => ({
            original: url,
            converted: this.convertUrl(url, targetAgent),
            parsed: this.parseUrl(url)
        }));
    }

    // Get all supported agents
    getSupportedAgents() {
        return Object.keys(this.agents);
    }

    // Get friendly agent names
    getAgentDisplayName(domain) {
        const names = {
            'superbuy.com': 'Superbuy',
            'sugargoo.com': 'Sugargoo',
            'joyagoo.com': 'Joyabuy',
            'mycnbox.com': 'MyCNBox',
            'itaobuy.com': 'ITaoBuy',
            'acbuy.com': 'ACbuy',
            'allchinabuy.com': 'AllChinaBuy',
            'cnfans.com': 'CNFans',
            'mulebuy.com': 'MuleBuy',
            'hoobuy.com': 'Hoobuy',
            'loongbuy.com': 'LoongBuy',
            'lovegobuy.com': 'LoveGoBuy',
            'basetao.com': 'BaseTao',
            'eastmallbuy.com': 'EastMallBuy',
            'hubbuycn.com': 'HubbuyCN',
            'oopbuy.com': 'OopBuy',
            'orientdig.com': 'OrientDig',
            'yoybuy.com': 'YoyBuy',
            'hipobuy.com': 'HipoBuy',
            'npbuy.com': 'NPBuy',
            'gtbuy.com': 'GTBuy',
            'pantherbuy.com': 'PantherBuy',
            'ootdbuy.com': 'OOTDBuy',
            'cssbuy.com': 'CSSBuy'
        };
        return names[domain] || domain;
    }
}

// Make available globally for use in extension
if (typeof window !== 'undefined') {
    window.ShippingAgentConverter = ShippingAgentConverter;
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShippingAgentConverter;
}