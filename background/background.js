// Background service worker for Shipping// Background service worker for Shipping Agent Redirector

// Import the converter and storage classes - use correct relative path from background folder
importScripts('../lib/converter.js', '../lib/storage.js');

class BackgroundService {
    constructor() {
        this.converter = null;
        this.storage = null;
        console.log('BackgroundService constructor called');
        this.init();
    }

    async init() {
        console.log('BackgroundService initializing...');
        
        // Initialize converter and storage
        this.converter = new ShippingAgentConverter();
        this.storage = new ExtensionStorage();
        
        console.log('BackgroundService initialized successfully');
        
        this.setupListeners();
        this.createContextMenus();
    }

    setupListeners() {
        // Handle tab updates for auto-redirect
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'loading' && tab.url) {
                this.handleTabUpdate(tabId, tab.url);
            }
        });

        // Handle context menu clicks
        chrome.contextMenus.onClicked.addListener((info, tab) => {
            this.handleContextMenuClick(info, tab);
        });

        // Handle messages from content scripts and popup
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Keep message channel open for async response
        });

        // Handle extension installation
        chrome.runtime.onInstalled.addListener((details) => {
            this.handleInstallation(details);
        });
    }

    async handleTabUpdate(tabId, url) {
        try {
            const settings = await this.storage.getSettings();
            
            if (!settings.autoConvert) return;

            const parsed = this.converter.parseUrl(url);
            if (!parsed) return;

            // Don't redirect if already on preferred agent
            if (parsed.type === 'agent' && parsed.agent === settings.preferredAgent) {
                return;
            }

            // Don't redirect original platforms
            if (parsed.type === 'original') return;

            // Convert to preferred agent
            const convertedUrl = this.converter.convertUrl(url, settings.preferredAgent);
            if (convertedUrl && convertedUrl !== url) {
                // Add to history
                await this.storage.addToHistory({
                    originalUrl: url,
                    convertedUrl: convertedUrl,
                    fromAgent: parsed.agent || 'original',
                    toAgent: settings.preferredAgent,
                    platform: parsed.platform,
                    itemId: parsed.itemId
                });

                // Redirect
                chrome.tabs.update(tabId, { url: convertedUrl });
            }
        } catch (error) {
            console.error('Error handling tab update:', error);
        }
    }

    createContextMenus() {
        // Remove existing context menus
        chrome.contextMenus.removeAll(() => {
            // Create image search context menu
            chrome.contextMenus.create({
                id: 'search-image-taobao',
                title: 'Search image on Taobao',
                contexts: ['image']
            });

            chrome.contextMenus.create({
                id: 'search-image-agent',
                title: 'Search image on preferred agent',
                contexts: ['image']
            });

            // Create link conversion context menus
            chrome.contextMenus.create({
                id: 'convert-link',
                title: 'Convert with Agent Redirector',
                contexts: ['link']
            });

            chrome.contextMenus.create({
                id: 'separator1',
                type: 'separator',
                contexts: ['link']
            });

            chrome.contextMenus.create({
                id: 'add-to-favorites',
                title: 'Add to favorites',
                contexts: ['link', 'page']
            });
        });
    }

    async handleContextMenuClick(info, tab) {
        try {
            const settings = await this.storage.getSettings();

            switch (info.menuItemId) {
                case 'search-image-taobao':
                    await this.searchImageOnTaobao(info.srcUrl, tab);
                    break;

                case 'search-image-agent':
                    await this.searchImageOnAgent(info.srcUrl, settings.preferredAgent, tab);
                    break;

                case 'convert-link':
                    await this.convertLink(info.linkUrl, settings.preferredAgent, tab);
                    break;

                case 'add-to-favorites':
                    await this.addToFavorites(info.linkUrl || tab.url, tab);
                    break;
            }
        } catch (error) {
            console.error('Error handling context menu click:', error);
        }
    }

    async searchImageOnTaobao(imageUrl, tab) {
        // Open Taobao image search with the image URL
        const searchUrl = `https://s.taobao.com/search?imgfile=${encodeURIComponent(imageUrl)}&imgid=&commend=all&ssid=s5-e&search_type=item&sourceId=tb.index&spm=a21bo.2017.201856-taobao-item.2&ie=utf8&initiative_id=tbindexz_20170306`;
        
        chrome.tabs.create({ url: searchUrl });
    }

    async searchImageOnAgent(imageUrl, agentDomain, tab) {
        // This would depend on which agents support image search
        // For now, we'll redirect to Taobao and then convert
        await this.searchImageOnTaobao(imageUrl, tab);
    }

    async convertLink(linkUrl, targetAgent, tab) {
        const convertedUrl = this.converter.convertUrl(linkUrl, targetAgent);
        
        if (convertedUrl) {
            const parsed = this.converter.parseUrl(linkUrl);
            
            // Add to history
            await this.storage.addToHistory({
                originalUrl: linkUrl,
                convertedUrl: convertedUrl,
                fromAgent: parsed?.agent || 'original',
                toAgent: targetAgent,
                platform: parsed?.platform,
                itemId: parsed?.itemId
            });

            chrome.tabs.create({ url: convertedUrl });
        }
    }

    async addToFavorites(url, tab) {
        const parsed = this.converter.parseUrl(url);
        
        const result = await this.storage.addToFavorites({
            url: url,
            title: tab.title || '',
            notes: '',
            tags: [],
            platform: parsed?.platform,
            itemId: parsed?.itemId,
            agent: parsed?.agent
        });

        // Show notification
        if (result.success) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: '/assets/icons/icon48.png',
                title: 'Added to Favorites',
                message: `Added "${tab.title}" to your favorites`
            });
        }
    }

    async handleMessage(message, sender, sendResponse) {
        try {
            console.log('Background received message:', message.action, message);
            
            switch (message.action) {
                case 'convertUrl':
                    const convertedUrl = this.converter.convertUrl(message.url, message.targetAgent);
                    sendResponse({ success: true, convertedUrl });
                    break;

                case 'parseUrl':
                    const parsed = this.converter.parseUrl(message.url);
                    sendResponse({ success: true, parsed });
                    break;

                case 'getSettings':
                    const settings = await this.storage.getSettings();
                    console.log('Sending settings:', settings);
                    sendResponse({ success: true, settings });
                    break;

                case 'updateSettings':
                    console.log('Updating settings:', message.updates);
                    const updateResult = await this.storage.updateSettings(message.updates);
                    console.log('Update result:', updateResult);
                    sendResponse({ success: updateResult });
                    break;

                case 'addToHistory':
                    const historyItem = await this.storage.addToHistory(message.item);
                    sendResponse({ success: true, item: historyItem });
                    break;

                case 'getHistory':
                    const history = await this.storage.getHistory(message.limit);
                    sendResponse({ success: true, history });
                    break;

                case 'clearHistory':
                    const clearResult = await this.storage.clearHistory();
                    console.log('Clear history result:', clearResult);
                    sendResponse({ success: clearResult });
                    break;

                case 'removeFavorite':
                    console.log('Removing favorite with ID:', message.id);
                    const removeResult = await this.storage.removeFavorite(message.id);
                    console.log('Remove favorite result:', removeResult);
                    sendResponse({ success: removeResult });
                    break;

                case 'searchFavorites':
                    const searchResults = await this.storage.searchFavorites(message.query);
                    sendResponse({ success: true, favorites: searchResults });
                    break;

                case 'exportData':
                    const exportData = await this.storage.exportData();
                    sendResponse({ success: true, data: exportData });
                    break;

                case 'importData':
                    const importResult = await this.storage.importData(message.data);
                    sendResponse(importResult);
                    break;

                case 'addToFavorites':
                    const favoriteResult = await this.storage.addToFavorites(message.item);
                    sendResponse(favoriteResult);
                    break;

                case 'getFavorites':
                    const favorites = await this.storage.getFavorites();
                    sendResponse({ success: true, favorites });
                    break;

                case 'getStats':
                    const stats = await this.storage.getStats();
                    sendResponse({ success: true, stats });
                    break;

                case 'batchConvert':
                    const batchResults = this.converter.convertBatch(message.urls, message.targetAgent);
                    sendResponse({ success: true, results: batchResults });
                    break;

                case 'getSupportedAgents':
                    const agents = this.converter.getSupportedAgents();
                    sendResponse({ success: true, agents });
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    handleInstallation(details) {
        if (details.reason === 'install') {
            // First time installation
            chrome.tabs.create({
                url: chrome.runtime.getURL('popup/popup.html')
            });
        }
    }
}

// Initialize background service
const backgroundService = new BackgroundService();