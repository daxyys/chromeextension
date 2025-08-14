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
                    platform: /[?&]platform=([^&]+)/
                },
                build: (itemId, platform) => `https://joyagoo.com/product?id=${itemId}&platform=${platform}`
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
                build: (itemId, platform) => `https://cnfans.com/product?id=${itemId}&platform=${platform}`
            },
            'mulebuy.com': {
                type: 'query',
                patterns: {
                    extract: /[?&]id=([^&]+)/,
                    platform: /[?&]platform=([^&]+)/
                },
                build: (itemId, platform, originalUrl) => {
                    // MuleBuy requires searchInfo parameter
                    if (originalUrl) {
                        return `https://mulebuy.com/product?id=${itemId}&platform=${platform}&searchInfo=${originalUrl}`;
                    }
                    return `https://mulebuy.com/product?id=${itemId}&platform=${platform}`;
                }
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
            'niuniubox.com': {
                type: 'query',
                patterns: {
                    extract: /[?&]id=([^&]+)/,
                    platform: /[?&]platform=([^&]+)/
                },
                build: (itemId, platform) => `https://niuniubox.com/product-detail/?platform=${platform}&id=${itemId}`
            },

            // URL Encoded Based
            'superbuy.com': {
                type: 'encoded_url',
                patterns: {
                    extract: /[?&]url=([^&]+)/
                },
                build: (originalUrl) => `https://www.superbuy.com/en/page/buy/?nTag=Home-search&from=search-input&url=${encodeURIComponent(originalUrl)}`
            },
            'sugargoo.com': {
                type: 'encoded_url',
                patterns: {
                    extract: /[?&]productLink=([^&]+)/
                },
                build: (originalUrl) => `https://www.sugargoo.com/productDetail?productLink=${encodeURIComponent(encodeURIComponent(originalUrl))}`
            },
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
                build: (originalUrl) => `https://www.allchinabuy.com/en/page/buy/?nTag=Home-search&from=search-input&_search=url&position=&url=${encodeURIComponent(originalUrl)}`
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
                build: (originalUrl, platform) => {
                    // EastMallBuy uses different tp parameter based on platform
                    let tp = 'taobao'; // default
                    if (originalUrl.includes('1688.com')) {
                        tp = '1688';
                    }
                    return `https://www.eastmallbuy.com/index/item/index.html?tp=${tp}&tid=&searchlang=en&url=${encodeURIComponent(originalUrl)}&inviter=daxxyyy`;
                }
            },
            'hubbuycn.com': {
                type: 'encoded_url',
                patterns: {
                    extract: /[?&]url=([^&]+)/
                },
                build: (originalUrl, platform) => {
                    // HubbuyCN uses different paths and tp parameters
                    if (originalUrl.includes('1688.com')) {
                        return `https://hubbuycn.com/index/item/index1688.html?tp=1688&tid=&searchlang=en&url=${encodeURIComponent(originalUrl)}&inviter=blehbleh2`;
                    } else if (originalUrl.includes('weidian.com')) {
                        return `https://hubbuycn.com/index/item/index.html?tp=micro&tid=&searchlang=en&url=${encodeURIComponent(originalUrl)}&inviter=blehbleh2`;
                    } else {
                        return `https://hubbuycn.com/index/item/index.html?tp=taobao&tid=&searchlang=en&url=${encodeURIComponent(originalUrl)}&inviter=blehbleh2`;
                    }
                }
            },
            'pantherbuy.com': {
                type: 'encoded_url',
                patterns: {
                    extract: /[?&]url=([^&]+)/
                },
                build: (originalUrl) => `https://pantherbuy.com/index/item/index.html?tp=micro&tid=&searchlang=en&url=${encodeURIComponent(originalUrl)}`
            },
            'wemimi.com': {
                type: 'encoded_url',
                patterns: {
                    extract: /[?&]productLink=([^&]+)/
                },
                build: (originalUrl) => `https://www.wemimi.com/#/home/productDetail?productLink=${encodeURIComponent(encodeURIComponent(originalUrl))}`
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
            'usfans.com': {
                type: 'path',
                patterns: {
                    extract: /\/product\/(\d+)\/(\d+)/
                },
                build: (platform, itemId) => `https://www.usfans.com/product/${platform}/${itemId}`
            },

            // Special/Custom Based
            'cssbuy.com': {
                type: 'special',
                patterns: {
                    extract: /\/item-(?:([^-]+)-)?(\d+)\.html/
                },
                build: (platform, itemId) => {
                    // CSSBuy format varies by platform
                    if (platform === '1688') {
                        return `https://www.cssbuy.com/item-1688-${itemId}.html`;
                    } else if (platform === 'micro') {
                        return `https://www.cssbuy.com/item-micro-${itemId}.html`;
                    } else {
                        // Taobao and Tmall use no platform prefix
                        return `https://www.cssbuy.com/item-${itemId}.html`;
                    }
                }
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
                build: (itemId) => `https://weidian.com/item.html?itemID=${itemId}&spider_token=9db1`
            },
            '1688.com': {
                patterns: {
                    extract: /\/offer\/(\d+)\.html/
                },
                build: (itemId) => `https://detail.1688.com/offer/${itemId}.html`
            },
            'yupoo.com': {
                patterns: {
                    extract: /([^\/]+)\.x\.yupoo\.com/
                },
                build: (seller) => `https://${seller}.x.yupoo.com/albums`
            },
            'docs.google.com': {
                patterns: {
                    extract: /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/
                },
                build: (sheetId) => `https://docs.google.com/spreadsheets/d/${sheetId}/edit`
            }
        };

        // Comprehensive platform mappings for all agents
        this.platformMappings = {
            'taobao.com': {
                'mycnbox.com': 'taobao',
                'joyagoo.com': 'TAOBAO',
                'acbuy.com': 'TB',
                'cnfans.com': 'TAOBAO',
                'mulebuy.com': 'TAOBAO',
                'lovegobuy.com': 'taobao',
                'npbuy.com': 'TB',
                'gtbuy.com': 'taobao',
                'ootdbuy.com': 'TAOBAO',
                'orientdig.com': 'TAOBAO',
                'niuniubox.com': 'taobao',
                'hoobuy.com': '1',
                'basetao.com': 'taobao',
                'oopbuy.com': '1',
                'hipobuy.com': '1',
                'usfans.com': '2',
                'cssbuy.com': 'taobao'
            },
            'tmall.com': {
                'mycnbox.com': 'taobao', // Treats Tmall as Taobao
                'joyagoo.com': 'TAOBAO', // Treats Tmall as Taobao
                'acbuy.com': 'TB',       // Treats Tmall as Taobao
                'cnfans.com': 'TAOBAO', // Treats Tmall as Taobao
                'mulebuy.com': 'TAOBAO', // Treats Tmall as Taobao
                'lovegobuy.com': 'taobao', // Treats Tmall as Taobao
                'npbuy.com': null,       // Doesn't support Tmall
                'gtbuy.com': 'taobao',   // Treats Tmall as Taobao
                'ootdbuy.com': 'TAOBAO', // Treats Tmall as Taobao
                'orientdig.com': 'TAOBAO', // Treats Tmall as Taobao
                'niuniubox.com': 'tmall', // Only one that uses separate tmall
                'hoobuy.com': null,      // Doesn't support Tmall
                'basetao.com': 'taobao', // Treats Tmall as Taobao
                'oopbuy.com': '1',       // Treats Tmall as Taobao
                'hipobuy.com': '1',      // Treats Tmall as Taobao
                'usfans.com': '2',       // Treats Tmall as Taobao
                'cssbuy.com': 'tmall'    // Same format as Taobao
            },
            'weidian.com': {
                'mycnbox.com': 'weidian',
                'joyagoo.com': 'WEIDIAN',
                'acbuy.com': 'WD',
                'cnfans.com': 'WEIDIAN',
                'mulebuy.com': 'WEIDIAN',
                'lovegobuy.com': 'weidian',
                'npbuy.com': 'WD',
                'gtbuy.com': 'weidian',
                'ootdbuy.com': 'weidian',
                'orientdig.com': 'WEIDIAN',
                'niuniubox.com': 'micro',
                'hoobuy.com': '2',
                'basetao.com': 'weidian',
                'oopbuy.com': 'weidian',
                'hipobuy.com': 'weidian',
                'usfans.com': '3',
                'cssbuy.com': 'micro'
            },
            '1688.com': {
                'mycnbox.com': '1688',
                'joyagoo.com': 'ALI_1688',
                'acbuy.com': 'AL',
                'cnfans.com': 'ALI_1688',
                'mulebuy.com': null,        // Doesn't support 1688
                'lovegobuy.com': 'ali_1688',
                'npbuy.com': 'AL',
                'gtbuy.com': '1688',
                'ootdbuy.com': '1688',
                'orientdig.com': 'ALI_1688',
                'niuniubox.com': '1688',
                'hoobuy.com': null,         // Doesn't support 1688
                'basetao.com': '1688',
                'oopbuy.com': '0',
                'hipobuy.com': '0',
                'usfans.com': '1',
                'cssbuy.com': '1688'
            }
        };
    }

    // Extract information from any URL
    parseUrl(url) {
        const domain = this.extractDomain(url);
        
        // Check if it's an original platform
        for (const [platformDomain, config] of Object.entries(this.originalPlatforms)) {
            if (domain.includes(platformDomain)) {
                if (platformDomain === 'yupoo.com') {
                    // Special handling for Yupoo
                    const match = url.match(config.patterns.extract);
                    if (match) {
                        const seller = match[1];
                        // Extract album ID if present
                        const albumMatch = url.match(/\/albums\/(\d+)/);
                        const itemId = albumMatch ? albumMatch[1] : seller;
                        
                        return {
                            type: 'original',
                            platform: platformDomain,
                            itemId: itemId,
                            seller: seller,
                            originalUrl: url
                        };
                    }
                } else if (platformDomain === 'docs.google.com') {
                    // Special handling for Google Sheets
                    const match = url.match(config.patterns.extract);
                    if (match) {
                        const sheetId = match[1];
                        // Extract sheet name from URL if present
                        const gidMatch = url.match(/[#&]gid=(\d+)/);
                        const sheetName = gidMatch ? `Sheet-${gidMatch[1]}` : 'Main';
                        
                        return {
                            type: 'original',
                            platform: platformDomain,
                            itemId: sheetId,
                            sheetName: sheetName,
                            originalUrl: url
                        };
                    }
                } else {
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
                    let originalPlatform = this.reverseMapPlatform(platformKey, agentDomain);
                    
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
                    let decodedUrl = decodeURIComponent(urlMatch[1]);
                    
                    // Handle double encoding for sugargoo and wemimi
                    if (agentDomain === 'sugargoo.com' || agentDomain === 'wemimi.com') {
                        decodedUrl = decodeURIComponent(decodedUrl);
                    }
                    
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
                    let originalPlatform = this.reverseMapPlatform(pathMatch[1], agentDomain);
                    return {
                        type: 'agent',
                        agent: agentDomain,
                        itemId: pathMatch[2],
                        platform: originalPlatform,
                        originalUrl: this.buildOriginalUrl(originalPlatform, pathMatch[2])
                    };
                }
                break;

            case 'special':
                if (agentDomain === 'cssbuy.com') {
                    const cssMatch = url.match(config.patterns.extract);
                    if (cssMatch) {
                        let platformCode = cssMatch[1] || 'taobao'; // Default to taobao if no platform prefix
                        let originalPlatform = this.reverseMapPlatform(platformCode, agentDomain);
                        return {
                            type: 'agent',
                            agent: agentDomain,
                            itemId: cssMatch[2],
                            platform: originalPlatform,
                            originalUrl: this.buildOriginalUrl(originalPlatform, cssMatch[2])
                        };
                    }
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
        
        // Check if target agent supports this platform
        const platformMapping = this.platformMappings[parsed.platform];
        if (platformMapping && platformMapping[targetAgent] === null) {
            return null; // Agent doesn't support this platform
        }
        
        // Convert to specific agent
        const agentConfig = this.agents[targetAgent];
        if (!agentConfig) return null;
        
        switch (agentConfig.type) {
            case 'query':
                const platformCode = this.getPlatformCode(parsed.platform, targetAgent);
                if (!platformCode) return null;
                
                // Special handling for MuleBuy
                if (targetAgent === 'mulebuy.com') {
                    return agentConfig.build(parsed.itemId, platformCode, parsed.originalUrl);
                }
                return agentConfig.build(parsed.itemId, platformCode);
                
            case 'encoded_url':
                // Special handling for agents with platform-specific logic
                if (targetAgent === 'eastmallbuy.com' || targetAgent === 'hubbuycn.com') {
                    return agentConfig.build(parsed.originalUrl, parsed.platform);
                }
                return agentConfig.build(parsed.originalUrl);
                
            case 'path':
                const pathPlatform = this.getPlatformCode(parsed.platform, targetAgent);
                if (!pathPlatform) return null;
                return agentConfig.build(pathPlatform, parsed.itemId);
                
            case 'special':
                if (targetAgent === 'cssbuy.com') {
                    const cssPlatform = this.getPlatformCode(parsed.platform, targetAgent);
                    return agentConfig.build(cssPlatform, parsed.itemId);
                }
                break;
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
        const platformMappings = this.platformMappings[platform];
        if (!platformMappings) return null;
        
        const mapping = platformMappings[agent];
        return mapping !== undefined ? mapping : null;
    }

    // Reverse map platform codes back to original platform domains
    reverseMapPlatform(platformCode, agentDomain) {
        // Comprehensive reverse mappings
        const reverseMappings = {
            // Taobao variations
            'taobao': 'taobao.com',
            'TAOBAO': 'taobao.com',
            'TB': 'taobao.com',
            '1': 'taobao.com',
            '2': 'taobao.com', // USFans uses 2 for taobao
            
            // Tmall variations
            'tmall': 'tmall.com',
            
            // Weidian variations
            'weidian': 'weidian.com',
            'WEIDIAN': 'weidian.com',
            'WD': 'weidian.com',
            'micro': 'weidian.com',
            '2': 'weidian.com', // Hoobuy uses 2 for weidian
            '3': 'weidian.com', // USFans uses 3 for weidian
            
            // 1688 variations
            '1688': '1688.com',
            'ALI_1688': '1688.com',
            'AL': '1688.com',
            'ali_1688': '1688.com',
            '0': '1688.com', // OopBuy/HipoBuy use 0 for 1688
            '1': '1688.com'  // USFans uses 1 for 1688
        };

        // Special handling for agents with unique mappings
        if (agentDomain === 'usfans.com') {
            const usfansMappings = {
                '1': '1688.com',
                '2': 'taobao.com',
                '3': 'weidian.com'
            };
            return usfansMappings[platformCode] || 'taobao.com';
        }

        if (agentDomain === 'hoobuy.com') {
            const hooMappings = {
                '1': 'taobao.com',
                '2': 'weidian.com'
            };
            return hooMappings[platformCode] || 'taobao.com';
        }

        if (agentDomain === 'oopbuy.com' || agentDomain === 'hipobuy.com') {
            const pathMappings = {
                '0': '1688.com',
                '1': 'taobao.com',
                'weidian': 'weidian.com'
            };
            return pathMappings[platformCode] || 'taobao.com';
        }

        if (agentDomain === 'cssbuy.com') {
            const cssMappings = {
                '1688': '1688.com',
                'micro': 'weidian.com',
                'taobao': 'taobao.com',
                'tmall': 'tmall.com'
            };
            return cssMappings[platformCode] || 'taobao.com';
        }

        return reverseMappings[platformCode] || 'taobao.com';
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
            'joyagoo.com': 'Joyagoo',
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
            'hipobuy.com': 'HipoBuy',
            'npbuy.com': 'NPBuy',
            'gtbuy.com': 'GTBuy',
            'pantherbuy.com': 'PantherBuy',
            'ootdbuy.com': 'OOTDBuy',
            'cssbuy.com': 'CSSBuy',
            'usfans.com': 'USFans',
            'niuniubox.com': 'NiuNiuBox',
            'wemimi.com': 'WeMiMi'
        };
        return names[domain] || domain;
    }

    // Check if agent supports platform
    agentSupports(agentDomain, platform) {
        const platformMapping = this.platformMappings[platform];
        if (!platformMapping) return false;
        return platformMapping[agentDomain] !== null;
    }

    // Get supported platforms for an agent
    getSupportedPlatforms(agentDomain) {
        const platforms = [];
        for (const [platform, mappings] of Object.entries(this.platformMappings)) {
            if (mappings[agentDomain] !== null && mappings[agentDomain] !== undefined) {
                platforms.push(platform);
            }
        }
        return platforms;
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