// Popup script for Shipping Agent Redirector

class PopupManager {
    constructor() {
        console.log('PopupManager constructor called');
        console.log('Converter available:', typeof ShippingAgentConverter !== 'undefined');
        console.log('Storage available:', typeof ExtensionStorage !== 'undefined');
        
        this.converter = new ShippingAgentConverter();
        this.storage = new ExtensionStorage();
        this.currentTab = null;
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

    init() {
        console.log('Initializing popup...');
        
        // Check if required elements exist
        if (!this.checkRequiredElements()) {
            console.error('Required elements missing, skipping initialization');
            return;
        }
        
        // Load settings and other data
        this.loadSettings().then(() => {
            return this.loadStats();
        }).then(() => {
            return this.loadCurrentPageInfo();
        }).then(() => {
            this.setupEventListeners();
            console.log('Popup initialization complete');
        }).catch(error => {
            console.error('Error during initialization:', error);
        });
    }

    loadSettings() {
        return new Promise((resolve, reject) => {
            console.log('Loading settings...');
            chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
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
            chrome.runtime.sendMessage({ action: 'getStats' }, (response) => {
                if (response && response.success) {
                    const stats = response.stats;
                    
                    const redirectElement = document.getElementById('redirect-count');
                    const favoritesElement = document.getElementById('favorites-count');
                    
                    if (redirectElement) {
                        redirectElement.textContent = stats.totalRedirects;
                    }
                    if (favoritesElement) {
                        favoritesElement.textContent = stats.totalFavorites;
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
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const tab = tabs[0];
                this.currentTab = tab;

                if (tab && tab.url) {
                    const parsed = this.converter.parseUrl(tab.url);
                    
                    if (parsed) {
                        // Show current page info
                        const pageInfo = document.getElementById('current-page-info');
                        const platformElement = document.getElementById('current-platform');
                        const itemElement = document.getElementById('current-item');
                        
                        if (pageInfo && platformElement && itemElement) {
                            pageInfo.style.display = 'block';
                            platformElement.textContent = parsed.platform || parsed.agent || 'Unknown';
                            itemElement.textContent = parsed.itemId || 'Unknown';
                        }
                    } else {
                        // Hide current page info if not a supported page
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
            saveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Save button clicked');
                this.saveCurrentPage();
            });
        }

        // Main action buttons
        const batchBtn = document.getElementById('batch-convert-btn');
        if (batchBtn) {
            batchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Batch convert clicked');
                this.showPanel('batch-convert-panel');
            });
        }

        const historyBtn = document.getElementById('view-history-btn');
        if (historyBtn) {
            historyBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('History button clicked');
                this.showPanel('history-panel');
                this.loadHistory();
            });
        }

        // Quick links
        const favoritesLink = document.getElementById('manage-favorites');
        if (favoritesLink) {
            favoritesLink.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Favorites link clicked');
                this.showPanel('favorites-panel');
                this.loadFavorites();
            });
        }

        const settingsLink = document.getElementById('view-settings');
        if (settingsLink) {
            settingsLink.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Settings link clicked');
                this.showPanel('settings-panel');
                this.loadSettingsPanel();
            });
        }

        // Panel navigation
        const batchBack = document.getElementById('batch-back');
        if (batchBack) {
            batchBack.addEventListener('click', (e) => {
                e.preventDefault();
                this.hidePanel('batch-convert-panel');
            });
        }

        const historyBack = document.getElementById('history-back');
        if (historyBack) {
            historyBack.addEventListener('click', (e) => {
                e.preventDefault();
                this.hidePanel('history-panel');
            });
        }

        const favoritesBack = document.getElementById('favorites-back');
        if (favoritesBack) {
            favoritesBack.addEventListener('click', (e) => {
                e.preventDefault();
                this.hidePanel('favorites-panel');
            });
        }

        const settingsBack = document.getElementById('settings-back');
        if (settingsBack) {
            settingsBack.addEventListener('click', (e) => {
                e.preventDefault();
                this.hidePanel('settings-panel');
            });
        }

        // Full settings page button
        const fullSettingsBtn = document.getElementById('full-settings');
        if (fullSettingsBtn) {
            fullSettingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                chrome.runtime.openOptionsPage();
                window.close();
            });
        }

        // Batch convert functionality
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

        // History actions
        const clearHistoryBtn = document.getElementById('clear-history');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.clearHistory();
            });
        }

        // Favorites search
        const favoritesSearch = document.getElementById('favorites-search');
        if (favoritesSearch) {
            favoritesSearch.addEventListener('input', (e) => {
                this.searchFavorites(e.target.value);
            });
        }

        // Settings panel controls
        const popupAgentSelect = document.getElementById('popup-preferred-agent');
        if (popupAgentSelect) {
            popupAgentSelect.addEventListener('change', (e) => {
                this.updateSetting('preferredAgent', e.target.value);
            });
        }

        const popupCurrencySelect = document.getElementById('popup-currency-select');
        if (popupCurrencySelect) {
            popupCurrencySelect.addEventListener('change', (e) => {
                this.updateSetting('currency', e.target.value);
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
                this.updateSetting('theme', e.target.value);
                this.applyTheme(e.target.value);
            });
        }

        // Settings panel actions
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
        
        chrome.runtime.sendMessage({ 
            action: 'updateSettings', 
            updates 
        }, (response) => {
            if (response && response.success) {
                console.log('Setting updated successfully:', key, '=', value);
            } else {
                console.error('Failed to update setting:', key, response);
            }
        });
    }

    convertCurrentPage() {
        if (!this.currentTab || !this.currentTab.url) {
            console.log('No current tab or URL');
            return;
        }

        // Get preferred agent from settings
        chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
            if (!response || !response.success) {
                console.error('Could not get settings');
                return;
            }
            
            const targetAgent = response.settings.preferredAgent;
            console.log('Converting:', this.currentTab.url, 'to:', targetAgent);

            const convertedUrl = this.converter.convertUrl(this.currentTab.url, targetAgent);
            
            if (convertedUrl && convertedUrl !== this.currentTab.url) {
                console.log('Converted URL:', convertedUrl);
                
                // Add to history
                const parsed = this.converter.parseUrl(this.currentTab.url);
                chrome.runtime.sendMessage({
                    action: 'addToHistory',
                    item: {
                        originalUrl: this.currentTab.url,
                        convertedUrl: convertedUrl,
                        fromAgent: parsed?.agent || 'original',
                        toAgent: targetAgent,
                        platform: parsed?.platform,
                        itemId: parsed?.itemId
                    }
                });

                // Open converted URL in new tab
                chrome.tabs.create({ url: convertedUrl });
                window.close();
            } else {
                console.log('Could not convert URL or URL is the same');
            }
        });
    }

    saveCurrentPage() {
        if (!this.currentTab || !this.currentTab.url) return;

        const parsed = this.converter.parseUrl(this.currentTab.url);
        
        chrome.runtime.sendMessage({
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
            if (response && response.success) {
                // Update favorites count
                this.loadStats();
                console.log('Page saved to favorites');
            }
        });
    }

    showPanel(panelId) {
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.style.display = 'block';
            panel.classList.add('slide-in');
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

        // Get preferred agent from settings
        chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
            if (!response || !response.success) {
                console.error('Could not get settings');
                return;
            }
            
            const targetAgent = response.settings.preferredAgent;

            chrome.runtime.sendMessage({
                action: 'batchConvert',
                urls: urls,
                targetAgent: targetAgent
            }, (batchResponse) => {
                if (batchResponse && batchResponse.success) {
                    this.displayBatchResults(batchResponse.results);
                }
            });
        });
    }

    displayBatchResults(results) {
        const resultsContainer = document.getElementById('results-list');
        const resultsSection = document.getElementById('batch-results');
        
        // Check if elements exist
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
                    <div class="result-original">${result.original}</div>
                    <div class="result-converted">${result.converted}</div>
                `;
            } else {
                item.innerHTML = `
                    <div class="result-original">${result.original}</div>
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
        
        if (convertedUrls) {
            navigator.clipboard.writeText(convertedUrls).then(() => {
                // Show feedback that results were copied
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
        chrome.runtime.sendMessage({ 
            action: 'getHistory',
            limit: 50 
        }, (response) => {
            if (response && response.success) {
                this.displayHistory(response.history);
            }
        });
    }

    displayHistory(history) {
        const historyList = document.getElementById('history-list');
        
        // Check if element exists
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
                <div class="history-timestamp">${timestamp}</div>
                <div class="history-conversion">
                    <span class="history-from">${fromAgent}</span> → 
                    <span class="history-to">${toAgent}</span>
                </div>
                <div class="history-url">${item.convertedUrl}</div>
            `;
            
            // Add click handler to open URL
            historyItem.addEventListener('click', () => {
                chrome.tabs.create({ url: item.convertedUrl });
                window.close();
            });
            
            historyList.appendChild(historyItem);
        });
    }

    clearHistory() {
        console.log('Clearing history...');
        chrome.runtime.sendMessage({ action: 'clearHistory' }, (response) => {
            console.log('Clear history response:', response);
            
            if (response && response.success) {
                console.log('History cleared successfully');
                this.loadHistory();
                this.loadStats();
            } else {
                console.error('Failed to clear history:', response);
            }
        });
    }

    loadFavorites() {
        chrome.runtime.sendMessage({ action: 'getFavorites' }, (response) => {
            if (response && response.success) {
                this.displayFavorites(response.favorites);
            }
        });
    }

    displayFavorites(favorites) {
        const favoritesList = document.getElementById('favorites-list');
        
        // Check if element exists
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
                <div class="favorite-title">${item.title || 'Untitled'}</div>
                <div class="favorite-url">${item.url}</div>
                <div class="favorite-meta">
                    <span class="favorite-platform">${platform}</span>
                    <div class="favorite-actions">
                        <button class="open-favorite" data-url="${item.url}">Open</button>
                        <button class="convert-favorite" data-url="${item.url}">Convert</button>
                        <button class="remove-favorite" data-id="${item.id}">Remove</button>
                    </div>
                </div>
            `;
            
            favoritesList.appendChild(favoriteItem);
        });
        
        // Add event listeners for favorite actions
        this.setupFavoriteActions();
    }

    setupFavoriteActions() {
        // Open favorite
        document.querySelectorAll('.open-favorite').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const url = btn.getAttribute('data-url');
                chrome.tabs.create({ url });
                window.close();
            });
        });
        
        // Convert favorite
        document.querySelectorAll('.convert-favorite').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const url = btn.getAttribute('data-url');
                
                // Get preferred agent from settings
                chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
                    if (!response || !response.success) {
                        console.error('Could not get settings');
                        return;
                    }
                    
                    const targetAgent = response.settings.preferredAgent;
                    
                    chrome.runtime.sendMessage({
                        action: 'convertUrl',
                        url: url,
                        targetAgent: targetAgent
                    }, (convertResponse) => {
                        if (convertResponse && convertResponse.success && convertResponse.convertedUrl) {
                            chrome.tabs.create({ url: convertResponse.convertedUrl });
                            window.close();
                        }
                    });
                });
            });
        });
        
        // Remove favorite
        document.querySelectorAll('.remove-favorite').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.getAttribute('data-id'));
                console.log('Removing favorite with ID:', id);
                
                chrome.runtime.sendMessage({
                    action: 'removeFavorite',
                    id: id
                }, (response) => {
                    console.log('Remove favorite response:', response);
                    
                    if (response && response.success) {
                        console.log('Favorite removed successfully');
                        this.loadFavorites();
                        this.loadStats();
                    } else {
                        console.error('Failed to remove favorite:', response);
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
        
        chrome.runtime.sendMessage({
            action: 'searchFavorites',
            query: query
        }, (response) => {
            if (response && response.success) {
                this.displayFavorites(response.favorites);
            }
        });
    }

    loadSettingsPanel() {
        // Populate agent selector
        this.populatePopupAgentSelector();
        
        // Load current settings
        chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
            if (response && response.success) {
                const settings = response.settings;
                
                // Set preferred agent
                const agentSelect = document.getElementById('popup-preferred-agent');
                if (agentSelect && settings.preferredAgent) {
                    agentSelect.value = settings.preferredAgent;
                }

                // Set currency
                const currencySelect = document.getElementById('popup-currency-select');
                if (currencySelect && settings.currency) {
                    currencySelect.value = settings.currency;
                }

                // Set currency conversion toggle
                const currencyToggle = document.getElementById('popup-currency-toggle');
                if (currencyToggle && settings.enableCurrencyConversion !== false) {
                    currencyToggle.classList.add('active');
                }

                // Set theme
                const themeSelect = document.getElementById('popup-theme-select');
                if (themeSelect && settings.theme) {
                    themeSelect.value = settings.theme;
                }
            }
        });
    }

    populatePopupAgentSelector() {
        const agentSelect = document.getElementById('popup-preferred-agent');
        if (!agentSelect) return;

        const agents = this.converter.getSupportedAgents();
        
        // Clear existing options
        agentSelect.innerHTML = '';
        
        // Add agents
        agents.forEach(agentDomain => {
            const option = document.createElement('option');
            option.value = agentDomain;
            option.textContent = this.converter.getAgentDisplayName(agentDomain);
            agentSelect.appendChild(option);
        });
    }

    applyTheme(theme) {
        const elements = [
            document.querySelector('.extension-popup'),
            document.body,
            document.documentElement
        ];
        
        elements.forEach(element => {
            if (element) {
                element.removeAttribute('data-theme');
            }
        });
        
        if (theme === 'dark') {
            elements.forEach(element => {
                if (element) {
                    element.setAttribute('data-theme', 'dark');
                }
            });
            console.log('Applied dark theme to popup');
        } else if (theme === 'light') {
            elements.forEach(element => {
                if (element) {
                    element.setAttribute('data-theme', 'light');
                }
            });
            console.log('Applied light theme to popup');
        } else { // auto
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const themeValue = prefersDark ? 'dark' : 'light';
            elements.forEach(element => {
                if (element) {
                    element.setAttribute('data-theme', themeValue);
                }
            });
            console.log('Applied auto theme to popup:', themeValue);
        }
    }

    exportData() {
        chrome.runtime.sendMessage({ action: 'exportData' }, (response) => {
            if (response && response.success) {
                const dataStr = response.data;
                
                // Create and download file
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `agent-redirector-backup-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        });
    }

    clearAllData() {
        if (!confirm('Are you sure you want to clear all data? This will delete your history and favorites. This action cannot be undone.')) {
            return;
        }

        // Clear history and favorites
        chrome.runtime.sendMessage({ action: 'clearHistory' }, (response) => {
            if (response && response.success) {
                // Reset favorites
                const defaultSettings = {
                    history: [],
                    favorites: []
                };

                chrome.runtime.sendMessage({
                    action: 'updateSettings',
                    updates: defaultSettings
                }, (updateResponse) => {
                    if (updateResponse && updateResponse.success) {
                        // Refresh stats
                        this.loadStats();
                        alert('Data cleared successfully.');
                    } else {
                        alert('Error clearing data. Please try again.');
                    }
                });
            } else {
                alert('Error clearing data. Please try again.');
            }
        });
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing popup...');
    
    // Add a small delay to ensure all elements are rendered
    setTimeout(() => {
        try {
            new PopupManager();
        } catch (error) {
            console.error('Error initializing popup:', error);
        }
    }, 50);
});