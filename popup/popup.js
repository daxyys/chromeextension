// Popup script for Shipping Agent Redirector

// Declare Chrome extension APIs to avoid IDE errors
const chromeAPI = chrome;

class PopupManager {
    constructor() {
        console.log('PopupManager constructor called');
        console.log('Converter available:', typeof ShippingAgentConverter !== 'undefined');
        console.log('Storage available:', typeof ExtensionStorage !== 'undefined');
        
        this.converter = new ShippingAgentConverter();
        this.storage = new ExtensionStorage();
        this.currentTab = null;
        
        // Track current stats to prevent overriding optimistic updates
        this.currentStats = {
            redirects: 0,
            favorites: 0
        };
        
        console.log('PopupManager initialized');
        this.init();
    }

    checkRequiredElements() {
        const requiredElements = [
            'auto-convert-toggle',
            'redirect-count',
            'favorites-count'
        ];
        
        const missingElements = [];
        requiredElements.forEach(id => {
            if (!document.getElementById(id)) {
                missingElements.push(id);
            }
        });
        
        if (missingElements.length > 0) {
            console.error('Missing required elements:', missingElements);
            return false;
        }
        
        return true;
    }

    async init() {
        console.log('Initializing popup...');
        
        // Check if Chrome extension API is available
        if (!chromeAPI || !chromeAPI.runtime) {
            console.error('Chrome extension API not available');
            return;
        }
        
        // Check if required elements exist
        if (!this.checkRequiredElements()) {
            console.error('Required elements missing, skipping initialization');
            return;
        }
        
        try {
            await this.loadSettings();
            await this.loadStats();
            await this.loadCurrentPageInfo();
            this.setupEventListeners();
            console.log('Popup initialization complete');
        } catch (error) {
            console.error('Error during initialization:', error);
        }
    }

    loadSettings() {
        return new Promise((resolve, reject) => {
            console.log('Loading settings...');
            
            chromeAPI.runtime.sendMessage({ action: 'getSettings' }, (response) => {
                if (chromeAPI.runtime.lastError) {
                    console.error('Runtime error:', chromeAPI.runtime.lastError);
                    reject(new Error(chromeAPI.runtime.lastError.message));
                    return;
                }
                
                if (response && response.success) {
                    const settings = response.settings;
                    console.log('Settings loaded:', settings);
                    
                    // Apply theme first
                    if (settings.theme) {
                        this.applyTheme(settings.theme);
                    }
                    
                    // Set auto-convert toggle
                    const toggle = document.getElementById('auto-convert-toggle');
                    if (toggle) {
                        if (settings.autoConvert) {
                            toggle.classList.add('active');
                            console.log('Toggle set to active');
                        } else {
                            toggle.classList.remove('active');
                            console.log('Toggle set to inactive');
                        }
                    }
                    resolve(settings);
                } else {
                    console.error('Failed to load settings:', response);
                    reject(new Error('Failed to load settings'));
                }
            });
        });
    }

    loadStats() {
        return new Promise((resolve, reject) => {
            chromeAPI.runtime.sendMessage({ action: 'getStats' }, (response) => {
                if (chromeAPI.runtime.lastError) {
                    console.error('Runtime error:', chromeAPI.runtime.lastError);
                    reject(new Error(chromeAPI.runtime.lastError.message));
                    return;
                }
                
                if (response && response.success) {
                    const stats = response.stats;
                    
                    // Update our tracking
                    this.currentStats.redirects = stats.totalRedirects || 0;
                    this.currentStats.favorites = stats.totalFavorites || 0;
                    
                    const redirectElement = document.getElementById('redirect-count');
                    const favoritesElement = document.getElementById('favorites-count');
                    
                    if (redirectElement) {
                        redirectElement.textContent = String(this.currentStats.redirects);
                    }
                    if (favoritesElement) {
                        favoritesElement.textContent = String(this.currentStats.favorites);
                    }
                    resolve(stats);
                } else {
                    console.error('Error loading stats:', response);
                    reject(new Error('Failed to load stats'));
                }
            });
        });
    }

    loadCurrentPageInfo() {
        return new Promise((resolve, reject) => {
            chromeAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (chromeAPI.runtime.lastError) {
                    console.error('Runtime error:', chromeAPI.runtime.lastError);
                    reject(new Error(chromeAPI.runtime.lastError.message));
                    return;
                }
                
                const tab = tabs[0];
                this.currentTab = tab;

                if (tab && tab.url) {
                    const parsed = this.converter.parseUrl(tab.url);
                    
                    if (parsed) {
                        const pageInfo = document.getElementById('current-page-info');
                        const platformElement = document.getElementById('current-platform');
                        const itemElement = document.getElementById('current-item');
                        
                        if (pageInfo && platformElement && itemElement) {
                            pageInfo.style.display = 'block';
                            
                            // Display platform info
                            if (parsed.platform === 'yupoo.com') {
                                platformElement.textContent = `Yupoo (${parsed.seller || 'Unknown'})`;
                                itemElement.textContent = parsed.itemId || 'Store';
                                
                                // Hide Convert and Original buttons for Yupoo, only show Save
                                const convertBtn = document.getElementById('convert-current');
                                const originalBtn = document.getElementById('original-platform');
                                if (convertBtn) convertBtn.style.display = 'none';
                                if (originalBtn) originalBtn.style.display = 'none';
                                
                                // Make Save button full width
                                const pageActions = document.querySelector('.page-actions');
                                if (pageActions) {
                                    pageActions.style.gridTemplateColumns = '1fr';
                                }
                            } else if (parsed.platform === 'docs.google.com') {
                                platformElement.textContent = 'Google Sheets';
                                itemElement.textContent = parsed.sheetName || 'Spreadsheet';
                                
                                // Hide Convert and Original buttons for Google Sheets, only show Save
                                const convertBtn = document.getElementById('convert-current');
                                const originalBtn = document.getElementById('original-platform');
                                if (convertBtn) convertBtn.style.display = 'none';
                                if (originalBtn) originalBtn.style.display = 'none';
                                
                                // Make Save button full width
                                const pageActions = document.querySelector('.page-actions');
                                if (pageActions) {
                                    pageActions.style.gridTemplateColumns = '1fr';
                                }
                            } else {
                                platformElement.textContent = parsed.platform || parsed.agent || 'Unknown';
                                itemElement.textContent = parsed.itemId || 'Unknown';
                                
                                // Show all buttons for other platforms
                                const convertBtn = document.getElementById('convert-current');
                                const originalBtn = document.getElementById('original-platform');
                                if (convertBtn) convertBtn.style.display = '';
                                if (originalBtn) originalBtn.style.display = '';
                                
                                // Reset grid layout
                                const pageActions = document.querySelector('.page-actions');
                                if (pageActions) {
                                    pageActions.style.gridTemplateColumns = '1fr 1fr 1fr';
                                }
                            }
                        }
                    } else {
                        const pageInfo = document.getElementById('current-page-info');
                        if (pageInfo) {
                            pageInfo.style.display = 'none';
                        }
                    }
                }
                resolve(tab);
            });
        });
    }

    setupEventListeners() {
        // Auto-convert toggle
        const autoToggle = document.getElementById('auto-convert-toggle');
        if (autoToggle) {
            autoToggle.addEventListener('click', (e) => {
                const toggle = e.target.closest('.toggle');
                if (toggle) {
                    toggle.classList.toggle('active');
                    this.updateSetting('autoConvert', toggle.classList.contains('active'));
                }
            });
        }

        // Current page actions
        const convertBtn = document.getElementById('convert-current');
        if (convertBtn) {
            convertBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Convert button clicked');
                this.convertCurrentPage();
            });
        }

        const saveBtn = document.getElementById('save-current');
        if (saveBtn) {
            saveBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                console.log('Save button clicked');
                await this.saveCurrentPage();
            });
        }

        const originalBtn = document.getElementById('original-platform');
        if (originalBtn) {
            originalBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Original platform button clicked');
                this.goToOriginalPlatform();
            });
        }
        

        // Main action buttons
        const batchBtn = document.getElementById('batch-convert-btn');
        if (batchBtn) {
            batchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // Open batch convert page in new tab instead of showing panel
                chromeAPI.tabs.create({ 
                    url: chromeAPI.runtime.getURL('batch/batch.html')
                });
                window.close();
            });
        }

        const historyBtn = document.getElementById('view-history-btn');
        if (historyBtn) {
            historyBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPanel('history-panel');
                this.loadHistory();
            });
        }

        // Quick links
        const favoritesLink = document.getElementById('manage-favorites');
        if (favoritesLink) {
            favoritesLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPanel('favorites-panel');
                this.loadFavorites();
            });
        }

        const settingsLink = document.getElementById('view-settings');
        if (settingsLink) {
            settingsLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPanel('settings-panel');
                this.loadSettingsPanel();
            });
        }

        this.setupPanelNavigation();
        this.setupBatchConvert();
        this.setupSettingsControls();
        this.setupHistoryActions();
        this.setupFavoritesSearch();
    }

    setupPanelNavigation() {
        const panels = [
            { backId: 'batch-back', panelId: 'batch-convert-panel' },
            { backId: 'history-back', panelId: 'history-panel' },
            { backId: 'favorites-back', panelId: 'favorites-panel' },
            { backId: 'settings-back', panelId: 'settings-panel' }
        ];

        panels.forEach(({ backId, panelId }) => {
            const backBtn = document.getElementById(backId);
            if (backBtn) {
                backBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.hidePanel(panelId);
                });
            }
        });

        const fullSettingsBtn = document.getElementById('full-settings');
        if (fullSettingsBtn) {
            fullSettingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                chromeAPI.runtime.openOptionsPage();
                window.close();
            });
        }
    }

    setupBatchConvert() {
        const convertBatchBtn = document.getElementById('convert-batch');
        if (convertBatchBtn) {
            convertBatchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.performBatchConvert();
            });
        }

        const clearBatchBtn = document.getElementById('clear-batch');
        if (clearBatchBtn) {
            clearBatchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const batchUrls = document.getElementById('batch-urls');
                const batchResults = document.getElementById('batch-results');
                
                if (batchUrls) {
                    batchUrls.value = '';
                }
                if (batchResults) {
                    batchResults.style.display = 'none';
                }
            });
        }

        const copyResultsBtn = document.getElementById('copy-results');
        if (copyResultsBtn) {
            copyResultsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.copyBatchResults();
            });
        }
    }

    setupHistoryActions() {
        const clearHistoryBtn = document.getElementById('clear-history');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.clearHistory();
            });
        }
    }

    setupFavoritesSearch() {
        const favoritesSearch = document.getElementById('favorites-search');
        if (favoritesSearch) {
            favoritesSearch.addEventListener('input', (e) => {
                const input = e.target;
                this.searchFavorites(input.value);
            });
        }
    }

    setupSettingsControls() {
        const popupAgentSelect = document.getElementById('popup-preferred-agent');
        if (popupAgentSelect) {
            popupAgentSelect.addEventListener('change', (e) => {
                const select = e.target;
                this.updateSetting('preferredAgent', select.value);
            });
        }

        const popupCurrencySelect = document.getElementById('popup-currency-select');
        if (popupCurrencySelect) {
            popupCurrencySelect.addEventListener('change', (e) => {
                const select = e.target;
                this.updateSetting('currency', select.value);
            });
        }

        const popupCurrencyToggle = document.getElementById('popup-currency-toggle');
        if (popupCurrencyToggle) {
            popupCurrencyToggle.addEventListener('click', () => {
                popupCurrencyToggle.classList.toggle('active');
                this.updateSetting('enableCurrencyConversion', popupCurrencyToggle.classList.contains('active'));
            });
        }

        const popupThemeSelect = document.getElementById('popup-theme-select');
        if (popupThemeSelect) {
            popupThemeSelect.addEventListener('change', (e) => {
                const select = e.target;
                this.updateSetting('theme', select.value);
                this.applyTheme(select.value);
            });
        }

        const exportDataPopup = document.getElementById('export-data-popup');
        if (exportDataPopup) {
            exportDataPopup.addEventListener('click', () => {
                this.exportData();
            });
        }

        const clearDataPopup = document.getElementById('clear-data-popup');
        if (clearDataPopup) {
            clearDataPopup.addEventListener('click', () => {
                this.clearAllData();
            });
        }
    }

    updateSetting(key, value) {
        console.log('Updating setting:', key, '=', value);
        
        const updates = {};
        updates[key] = value;
        
        chromeAPI.runtime.sendMessage({ 
            action: 'updateSettings', 
            updates 
        }, (response) => {
            if (chromeAPI.runtime.lastError) {
                console.error('Runtime error:', chromeAPI.runtime.lastError);
                return;
            }
            
            if (response && response.success) {
                console.log('Setting updated successfully:', key, '=', value);
            } else {
                console.error('Failed to update setting:', key, response);
            }
        });
    }

    // FIXED: Better counter management that doesn't get overridden
    updateCountersDirectly(redirectChange = 0, favoritesChange = 0) {
        // Update our internal tracking
        this.currentStats.redirects = Math.max(0, this.currentStats.redirects + redirectChange);
        this.currentStats.favorites = Math.max(0, this.currentStats.favorites + favoritesChange);
        
        // Update UI immediately
        const redirectElement = document.getElementById('redirect-count');
        const favoritesElement = document.getElementById('favorites-count');
        
        if (redirectElement) {
            redirectElement.textContent = String(this.currentStats.redirects);
        }
        
        if (favoritesElement) {
            favoritesElement.textContent = String(this.currentStats.favorites);
        }
    }

    // FIXED: Load stats without overriding optimistic updates
    async loadStatsWithoutOverride() {
        return new Promise((resolve) => {
            chromeAPI.runtime.sendMessage({ action: 'getStats' }, (response) => {
                if (chromeAPI.runtime.lastError) {
                    console.error('Runtime error:', chromeAPI.runtime.lastError);
                    resolve(null);
                    return;
                }
                
                if (response && response.success) {
                    const stats = response.stats;
                    
                    // Only update if our local stats are obviously wrong (like negative)
                    if (this.currentStats.redirects < 0 || this.currentStats.favorites < 0) {
                        this.currentStats.redirects = stats.totalRedirects || 0;
                        this.currentStats.favorites = stats.totalFavorites || 0;
                        
                        const redirectElement = document.getElementById('redirect-count');
                        const favoritesElement = document.getElementById('favorites-count');
                        
                        if (redirectElement) {
                            redirectElement.textContent = String(this.currentStats.redirects);
                        }
                        if (favoritesElement) {
                            favoritesElement.textContent = String(this.currentStats.favorites);
                        }
                    }
                    
                    resolve(stats);
                } else {
                    resolve(null);
                }
            });
        });
    }

    convertCurrentPage() {
        if (!this.currentTab || !this.currentTab.url) {
            console.log('No current tab or URL');
            return;
        }

        chromeAPI.runtime.sendMessage({ action: 'getSettings' }, (response) => {
            if (chromeAPI.runtime.lastError) {
                console.error('Runtime error:', chromeAPI.runtime.lastError);
                return;
            }
            
            if (!response || !response.success) {
                console.error('Could not get settings');
                return;
            }
            
            const targetAgent = response.settings.preferredAgent;
            console.log('Converting:', this.currentTab.url, 'to:', targetAgent);

            const convertedUrl = this.converter.convertUrl(this.currentTab.url, targetAgent);
            
            if (convertedUrl && convertedUrl !== this.currentTab.url) {
                console.log('Converted URL:', convertedUrl);
                
                // Immediately update redirect counter
                this.updateCountersDirectly(1, 0);
                
                const parsed = this.converter.parseUrl(this.currentTab.url);
                chromeAPI.runtime.sendMessage({
                    action: 'addToHistory',
                    item: {
                        originalUrl: this.currentTab.url,
                        convertedUrl: convertedUrl,
                        fromAgent: parsed?.agent || 'original',
                        toAgent: targetAgent,
                        platform: parsed?.platform,
                        itemId: parsed?.itemId
                    }
                }, (historyResponse) => {
                    // Don't override our optimistic update
                    if (!historyResponse || !historyResponse.success) {
                        this.updateCountersDirectly(-1, 0);
                    }
                });

                chromeAPI.tabs.create({ url: convertedUrl });
                window.close();
            } else {
                console.log('Could not convert URL or URL is the same');
            }
        });
    }

    goToOriginalPlatform() {
        if (!this.currentTab || !this.currentTab.url) {
            console.log('No current tab or URL');
            return;
        }

        const parsed = this.converter.parseUrl(this.currentTab.url);
        if (!parsed || !parsed.originalUrl) {
            console.log('Could not determine original URL');
            return;
        }

        console.log('Converting to original platform:', parsed.originalUrl);
        
        // Immediately update redirect counter
        this.updateCountersDirectly(1, 0);
        
        // REQUEST BYPASS for auto-redirect before navigating
        chromeAPI.runtime.sendMessage({
            action: 'bypassAutoRedirect',
            url: parsed.originalUrl
        }, (bypassResponse) => {
            if (chromeAPI.runtime.lastError) {
                console.error('Error setting bypass:', chromeAPI.runtime.lastError);
            } else {
                console.log('Auto-redirect bypass set for:', parsed.originalUrl);
            }
            
            // Add to history
            chromeAPI.runtime.sendMessage({
                action: 'addToHistory',
                item: {
                    originalUrl: this.currentTab.url,
                    convertedUrl: parsed.originalUrl,
                    fromAgent: parsed.agent || 'unknown',
                    toAgent: 'original',
                    platform: parsed.platform,
                    itemId: parsed.itemId
                }
            }, (historyResponse) => {
                // Don't override our optimistic update
                if (!historyResponse || !historyResponse.success) {
                    this.updateCountersDirectly(-1, 0);
                }
            });

            // Navigate to original URL (now with bypass protection)
            chromeAPI.tabs.create({ url: parsed.originalUrl });
            window.close();
        });
    }

    async saveCurrentPage() {
        if (!this.currentTab || !this.currentTab.url) return;

        const parsed = this.converter.parseUrl(this.currentTab.url);
        
        // Immediately update counter for instant feedback
        this.updateCountersDirectly(0, 1);
        
        return new Promise((resolve) => {
            chromeAPI.runtime.sendMessage({
                action: 'addToFavorites',
                item: {
                    url: this.currentTab.url,
                    title: this.currentTab.title || '',
                    notes: '',
                    tags: [],
                    platform: parsed?.platform,
                    itemId: parsed?.itemId,
                    agent: parsed?.agent
                }
            }, (response) => {
                if (chromeAPI.runtime.lastError) {
                    console.error('Runtime error:', chromeAPI.runtime.lastError);
                    this.updateCountersDirectly(0, -1);
                    resolve();
                    return;
                }
                
                if (response && response.success) {
                    console.log('Page saved to favorites');
                    
                    const saveBtn = document.getElementById('save-current');
                    if (saveBtn) {
                        const originalText = saveBtn.textContent;
                        saveBtn.textContent = 'Saved!';
                        saveBtn.style.background = 'var(--success-color, #28a745)';
                        setTimeout(() => {
                            saveBtn.textContent = originalText;
                            saveBtn.style.background = '';
                        }, 1500);
                    }
                } else {
                    this.updateCountersDirectly(0, -1);
                }
                resolve();
            });
        });
    }

    showPanel(panelId) {
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.style.display = 'block';
            panel.classList.add('slide-in');
            this.applyThemeToElement(panel);
        }
    }

    hidePanel(panelId) {
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.classList.add('slide-out');
            setTimeout(() => {
                panel.style.display = 'none';
                panel.classList.remove('slide-in', 'slide-out');
            }, 300);
        }
    }

    performBatchConvert() {
        const textarea = document.getElementById('batch-urls');
        if (!textarea) return;
        
        const urls = textarea.value.split('\n').filter(url => url.trim());
        if (urls.length === 0) return;

        chromeAPI.runtime.sendMessage({ action: 'getSettings' }, (response) => {
            if (chromeAPI.runtime.lastError || !response || !response.success) {
                console.error('Could not get settings');
                return;
            }
            
            const targetAgent = response.settings.preferredAgent;

            chromeAPI.runtime.sendMessage({
                action: 'batchConvert',
                urls: urls,
                targetAgent: targetAgent
            }, (batchResponse) => {
                if (chromeAPI.runtime.lastError || !batchResponse || !batchResponse.success) {
                    console.error('Batch convert failed');
                    return;
                }
                
                this.displayBatchResults(batchResponse.results);
            });
        });
    }

    displayBatchResults(results) {
        const resultsContainer = document.getElementById('results-list');
        const resultsSection = document.getElementById('batch-results');
        
        if (!resultsContainer || !resultsSection) {
            console.error('Batch results elements not found');
            return;
        }
        
        resultsContainer.innerHTML = '';
        
        results.forEach(result => {
            const item = document.createElement('div');
            item.className = 'result-item';
            
            if (result.converted) {
                item.innerHTML = `
                    <div class="result-original">${this.escapeHtml(result.original)}</div>
                    <div class="result-converted">${this.escapeHtml(result.converted)}</div>
                `;
            } else {
                item.innerHTML = `
                    <div class="result-original">${this.escapeHtml(result.original)}</div>
                    <div class="result-error">Could not convert this URL</div>
                `;
            }
            
            resultsContainer.appendChild(item);
        });
        
        resultsSection.style.display = 'block';
    }

    copyBatchResults() {
        const resultItems = document.querySelectorAll('.result-converted');
        const convertedUrls = Array.from(resultItems)
            .map(item => item.textContent)
            .filter(url => url && !url.includes('Could not convert'))
            .join('\n');
        
        if (convertedUrls && navigator.clipboard) {
            navigator.clipboard.writeText(convertedUrls).then(() => {
                const btn = document.getElementById('copy-results');
                if (btn) {
                    const originalText = btn.textContent;
                    btn.textContent = 'Copied!';
                    setTimeout(() => {
                        btn.textContent = originalText;
                    }, 1500);
                }
            });
        }
    }

    loadHistory() {
        chromeAPI.runtime.sendMessage({ 
            action: 'getHistory',
            limit: 50 
        }, (response) => {
            if (chromeAPI.runtime.lastError || !response || !response.success) {
                console.error('Failed to load history');
                return;
            }
            
            this.displayHistory(response.history);
        });
    }

    displayHistory(history) {
        const historyList = document.getElementById('history-list');
        if (!historyList) {
            console.error('History list element not found');
            return;
        }
        
        historyList.innerHTML = '';
        
        if (history.length === 0) {
            historyList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📚</div>
                    <h3>No History Yet</h3>
                    <p>Your conversion history will appear here once you start using the redirector.</p>
                </div>
            `;
            return;
        }
        
        history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const timestamp = new Date(item.timestamp).toLocaleString();
            const fromAgent = this.converter.getAgentDisplayName(item.fromAgent) || item.fromAgent;
            const toAgent = this.converter.getAgentDisplayName(item.toAgent) || item.toAgent;
            
            historyItem.innerHTML = `
                <div class="history-timestamp">${this.escapeHtml(timestamp)}</div>
                <div class="history-conversion">
                    <span class="history-from">${this.escapeHtml(fromAgent)}</span> → 
                    <span class="history-to">${this.escapeHtml(toAgent)}</span>
                </div>
                <div class="history-url">${this.escapeHtml(item.convertedUrl)}</div>
            `;
            
            historyItem.addEventListener('click', () => {
                chromeAPI.tabs.create({ url: item.convertedUrl });
                window.close();
            });
            
            historyList.appendChild(historyItem);
        });
    }

    async clearHistory() {
        if (!confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
            return;
        }
        
        console.log('Clearing history...');
        
        const historyList = document.getElementById('history-list');
        const clearBtn = document.getElementById('clear-history');
        
        if (clearBtn) {
            clearBtn.disabled = true;
            clearBtn.textContent = 'Clearing...';
        }
        
        if (historyList) {
            historyList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⏳</div>
                    <h3>Clearing History...</h3>
                    <p>Please wait while we clear your history.</p>
                </div>
            `;
        }
        
        // Immediately reset redirect counter
        this.updateCountersDirectly(-this.currentStats.redirects, 0);
        
        return new Promise((resolve) => {
            chromeAPI.runtime.sendMessage({ action: 'clearHistory' }, (response) => {
                if (chromeAPI.runtime.lastError) {
                    console.error('Runtime error:', chromeAPI.runtime.lastError);
                    resolve();
                    return;
                }
                
                if (response && response.success) {
                    console.log('History cleared successfully');
                    
                    if (historyList) {
                        historyList.innerHTML = `
                            <div class="empty-state">
                                <div class="empty-state-icon">📚</div>
                                <h3>No History Yet</h3>
                                <p>Your conversion history will appear here once you start using the redirector.</p>
                            </div>
                        `;
                    }
                    
                    if (clearBtn) {
                        clearBtn.textContent = 'Cleared!';
                        clearBtn.disabled = false;
                        setTimeout(() => {
                            clearBtn.textContent = 'Clear All';
                        }, 1500);
                    }
                } else {
                    console.error('Failed to clear history:', response);
                    
                    if (clearBtn) {
                        clearBtn.disabled = false;
                        clearBtn.textContent = 'Clear All';
                    }
                    
                    this.loadHistory();
                    this.loadStats();
                }
                resolve();
            });
        });
    }

    loadFavorites() {
        chromeAPI.runtime.sendMessage({ action: 'getFavorites' }, (response) => {
            if (chromeAPI.runtime.lastError || !response || !response.success) {
                console.error('Failed to load favorites');
                return;
            }
            
            this.displayFavorites(response.favorites);
        });
    }

    displayFavorites(favorites) {
        const favoritesList = document.getElementById('favorites-list');
        if (!favoritesList) {
            console.error('Favorites list element not found');
            return;
        }
        
        favoritesList.innerHTML = '';
        
        if (favorites.length === 0) {
            favoritesList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⭐</div>
                    <h3>No Favorites Yet</h3>
                    <p>Save your favorite products and stores to access them quickly later.</p>
                </div>
            `;
            return;
        }
        
        favorites.forEach(item => {
            const favoriteItem = document.createElement('div');
            favoriteItem.className = 'favorite-item';
            
            const platform = item.platform ? this.converter.getAgentDisplayName(item.platform) || item.platform : 'Unknown';
            
            favoriteItem.innerHTML = `
                <div class="favorite-title">${this.escapeHtml(item.title || 'Untitled')}</div>
                <div class="favorite-url">${this.escapeHtml(item.url)}</div>
                <div class="favorite-meta">
                    <span class="favorite-platform">${this.escapeHtml(platform)}</span>
                    <div class="favorite-actions">
                        <button class="open-favorite" data-url="${this.escapeHtml(item.url)}">Open</button>
                        <button class="convert-favorite" data-url="${this.escapeHtml(item.url)}">Convert</button>
                        <button class="remove-favorite" data-id="${item.id}">Remove</button>
                    </div>
                </div>
            `;
            
            favoritesList.appendChild(favoriteItem);
        });
        
        this.setupFavoriteActions();
    }

    setupFavoriteActions() {
        document.querySelectorAll('.open-favorite').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const url = btn.getAttribute('data-url');
                if (url) {
                    chromeAPI.tabs.create({ url });
                    window.close();
                }
            });
        });
        
        document.querySelectorAll('.convert-favorite').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const url = btn.getAttribute('data-url');
                if (!url) return;
                
                chromeAPI.runtime.sendMessage({ action: 'getSettings' }, (response) => {
                    if (chromeAPI.runtime.lastError || !response || !response.success) return;
                    
                    const targetAgent = response.settings.preferredAgent;
                    
                    chromeAPI.runtime.sendMessage({
                        action: 'convertUrl',
                        url: url,
                        targetAgent: targetAgent
                    }, (convertResponse) => {
                        if (chromeAPI.runtime.lastError || !convertResponse || !convertResponse.success) return;
                        
                        if (convertResponse.convertedUrl) {
                            chromeAPI.tabs.create({ url: convertResponse.convertedUrl });
                            window.close();
                        }
                    });
                });
            });
        });
        
        document.querySelectorAll('.remove-favorite').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                // Check if already processing
                if (btn.hasAttribute('data-processing')) {
                    console.log('Already processing, ignoring click');
                    return;
                }
                
                // Mark as processing
                btn.setAttribute('data-processing', 'true');
                btn.disabled = true;
                btn.textContent = 'Removing...';
                btn.style.opacity = '0.5';
                
                const id = parseInt(btn.getAttribute('data-id') || '0');
                console.log('Removing favorite with ID:', id);
                
                // Immediately update counter
                this.updateCountersDirectly(0, -1);
                
                // Remove the item from DOM immediately for instant feedback
                const favoriteItem = btn.closest('.favorite-item');
                if (favoriteItem) {
                    favoriteItem.style.opacity = '0.3';
                    favoriteItem.style.transform = 'scale(0.95)';
                    favoriteItem.style.transition = 'all 0.2s ease';
                    
                    setTimeout(() => {
                        favoriteItem.remove();
                        
                        // Check if favorites list is now empty
                        const favoritesList = document.getElementById('favorites-list');
                        if (favoritesList && favoritesList.children.length === 0) {
                            favoritesList.innerHTML = `
                                <div class="empty-state">
                                    <div class="empty-state-icon">⭐</div>
                                    <h3>No Favorites Yet</h3>
                                    <p>Save your favorite products and stores to access them quickly later.</p>
                                </div>
                            `;
                        }
                    }, 200);
                }
                
                chromeAPI.runtime.sendMessage({
                    action: 'removeFavorite',
                    id: id
                }, (response) => {
                    if (chromeAPI.runtime.lastError || !response || !response.success) {
                        console.error('Failed to remove favorite');
                        // Revert counter if failed
                        this.updateCountersDirectly(0, 1);
                    }
                });
            });
        });
    }

    searchFavorites(query) {
        if (!query.trim()) {
            this.loadFavorites();
            return;
        }
        
        chromeAPI.runtime.sendMessage({
            action: 'searchFavorites',
            query: query
        }, (response) => {
            if (chromeAPI.runtime.lastError || !response || !response.success) {
                console.error('Failed to search favorites');
                return;
            }
            
            this.displayFavorites(response.favorites);
        });
    }

    loadSettingsPanel() {
        this.populatePopupAgentSelector();
        
        chromeAPI.runtime.sendMessage({ action: 'getSettings' }, (response) => {
            if (chromeAPI.runtime.lastError || !response || !response.success) {
                console.error('Failed to load settings for panel');
                return;
            }
            
            const settings = response.settings;
            
            const agentSelect = document.getElementById('popup-preferred-agent');
            if (agentSelect && settings.preferredAgent) {
                agentSelect.value = settings.preferredAgent;
            }

            const currencySelect = document.getElementById('popup-currency-select');
            if (currencySelect && settings.currency) {
                currencySelect.value = settings.currency;
            }

            const currencyToggle = document.getElementById('popup-currency-toggle');
            if (currencyToggle && settings.enableCurrencyConversion !== false) {
                currencyToggle.classList.add('active');
            }

            const themeSelect = document.getElementById('popup-theme-select');
            if (themeSelect && settings.theme) {
                themeSelect.value = settings.theme;
            }
        });
    }

    populatePopupAgentSelector() {
        const agentSelect = document.getElementById('popup-preferred-agent');
        if (!agentSelect) return;

        const agents = this.converter.getSupportedAgents();
        agentSelect.innerHTML = '';
        
        agents.forEach(agentDomain => {
            const option = document.createElement('option');
            option.value = agentDomain;
            option.textContent = this.converter.getAgentDisplayName(agentDomain);
            agentSelect.appendChild(option);
        });
    }

    applyThemeToElement(element) {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 
                           document.body.getAttribute('data-theme') || 
                           'light';
        
        element.setAttribute('data-theme', currentTheme);
        
        const childElements = element.querySelectorAll('*');
        childElements.forEach(child => {
            child.setAttribute('data-theme', currentTheme);
        });
    }

    applyTheme(theme) {
        const elements = [
            document.documentElement,
            document.body,
            document.querySelector('.extension-popup'),
            ...document.querySelectorAll('.panel'),
            ...document.querySelectorAll('.content'),
            ...document.querySelectorAll('.panel-content'),
            ...document.querySelectorAll('.toggle-section'),
            ...document.querySelectorAll('.stat-card'),
            ...document.querySelectorAll('.current-page'),
            ...document.querySelectorAll('.setting-item'),
            ...document.querySelectorAll('.history-item'),
            ...document.querySelectorAll('.favorite-item'),
            ...document.querySelectorAll('.result-item'),
            ...document.querySelectorAll('.empty-state')
        ].filter(Boolean);
        
        elements.forEach(element => {
            element.removeAttribute('data-theme');
        });
        
        let themeToApply;
        
        if (theme === 'dark') {
            themeToApply = 'dark';
        } else if (theme === 'light') {
            themeToApply = 'light';
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            themeToApply = prefersDark ? 'dark' : 'light';
        }
        
        elements.forEach(element => {
            element.setAttribute('data-theme', themeToApply);
        });
        
        const formElements = [
            ...document.querySelectorAll('select'),
            ...document.querySelectorAll('input'),
            ...document.querySelectorAll('textarea'),
            ...document.querySelectorAll('button')
        ];
        
        formElements.forEach(element => {
            element.setAttribute('data-theme', themeToApply);
        });
        
        console.log(`Applied ${themeToApply} theme to popup (from ${theme} setting)`);
        
        document.body.style.display = 'none';
        document.body.offsetHeight;
        document.body.style.display = '';
    }

    exportData() {
        chromeAPI.runtime.sendMessage({ action: 'exportData' }, (response) => {
            if (chromeAPI.runtime.lastError || !response || !response.success) {
                console.error('Failed to export data');
                return;
            }
            
            const dataStr = response.data;
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `agent-redirector-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    clearAllData() {
        if (!confirm('Are you sure you want to clear all data? This will delete your history and favorites. This action cannot be undone.')) {
            return;
        }

        chromeAPI.runtime.sendMessage({ action: 'clearHistory' }, (response) => {
            if (chromeAPI.runtime.lastError || !response || !response.success) {
                alert('Error clearing data. Please try again.');
                return;
            }
            
            const defaultSettings = {
                history: [],
                favorites: []
            };

            chromeAPI.runtime.sendMessage({
                action: 'updateSettings',
                updates: defaultSettings
            }, (updateResponse) => {
                if (chromeAPI.runtime.lastError || !updateResponse || !updateResponse.success) {
                    alert('Error clearing data. Please try again.');
                    return;
                }
                
                // Reset our counters
                this.currentStats.redirects = 0;
                this.currentStats.favorites = 0;
                this.updateCountersDirectly(0, 0);
                
                alert('Data cleared successfully.');
            });
        });
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, function(m) { return map[m]; });
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing popup...');
    
    setTimeout(() => {
        try {
            new PopupManager();
        } catch (error) {
            console.error('Error initializing popup:', error);
        }
    }, 50);
});