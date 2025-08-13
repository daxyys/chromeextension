// Settings page script for Agent Redirector

class SettingsManager {
    constructor() {
        this.converter = new ShippingAgentConverter();
        this.storage = new ExtensionStorage();
        this.init();
    }

    async init() {
        console.log('Settings page initializing...');
        
        await this.setupTheme();
        await this.loadSettings();
        await this.loadStats();
        this.populateAgentSelector();
        this.setupEventListeners();
        
        console.log('Settings page initialized');
    }

    async setupTheme() {
        // Get saved theme or detect system preference
        const settings = await this.storage.getSettings();
        const savedTheme = settings.theme || 'auto';
        
        this.applyTheme(savedTheme);
        
        // Set the theme selector
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.value = savedTheme;
        }
    }

    applyTheme(theme) {
        const body = document.body;
        
        // Remove any existing theme attributes
        body.removeAttribute('data-theme');
        
        if (theme === 'dark') {
            body.setAttribute('data-theme', 'dark');
            console.log('Applied dark theme');
        } else if (theme === 'light') {
            body.setAttribute('data-theme', 'light');
            console.log('Applied light theme');
        } else { // auto
            // Use system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            body.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
            console.log('Applied auto theme:', prefersDark ? 'dark' : 'light');
        }
    }

    async loadSettings() {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
            if (response && response.success) {
                const settings = response.settings;
                console.log('Loaded settings:', settings);
                
                // Auto-convert toggle
                const autoToggle = document.getElementById('auto-convert-toggle');
                if (autoToggle && settings.autoConvert) {
                    autoToggle.classList.add('active');
                }

                // Currency conversion toggle
                const currencyToggle = document.getElementById('currency-conversion-toggle');
                if (currencyToggle && settings.enableCurrencyConversion !== false) {
                    currencyToggle.classList.add('active');
                }

                // Preferred agent
                const agentSelect = document.getElementById('preferred-agent-select');
                if (agentSelect && settings.preferredAgent) {
                    agentSelect.value = settings.preferredAgent;
                }

                // Currency
                const currencySelect = document.getElementById('currency-select');
                if (currencySelect && settings.currency) {
                    currencySelect.value = settings.currency;
                }

                // Max history
                const historySelect = document.getElementById('max-history-select');
                if (historySelect && settings.maxHistoryItems) {
                    historySelect.value = settings.maxHistoryItems.toString();
                }

                // Theme
                const themeSelect = document.getElementById('theme-select');
                if (themeSelect && settings.theme) {
                    themeSelect.value = settings.theme;
                }
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async loadStats() {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'getStats' });
            if (response && response.success) {
                const stats = response.stats;
                
                document.getElementById('total-redirects').textContent = stats.totalRedirects;
                document.getElementById('total-favorites').textContent = stats.totalFavorites;
                document.getElementById('recent-redirects').textContent = stats.recentRedirects;
                
                const mostUsedAgent = stats.mostUsedAgent 
                    ? this.converter.getAgentDisplayName(stats.mostUsedAgent)
                    : 'None';
                document.getElementById('most-used-agent').textContent = mostUsedAgent;
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    populateAgentSelector() {
        const agentSelect = document.getElementById('preferred-agent-select');
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

    setupEventListeners() {
        // Auto-convert toggle
        const autoToggle = document.getElementById('auto-convert-toggle');
        if (autoToggle) {
            autoToggle.addEventListener('click', () => {
                autoToggle.classList.toggle('active');
                this.updateSetting('autoConvert', autoToggle.classList.contains('active'));
            });
        }

        // Currency conversion toggle
        const currencyToggle = document.getElementById('currency-conversion-toggle');
        if (currencyToggle) {
            currencyToggle.addEventListener('click', () => {
                currencyToggle.classList.toggle('active');
                this.updateSetting('enableCurrencyConversion', currencyToggle.classList.contains('active'));
            });
        }

        // Theme selector
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                const theme = e.target.value;
                console.log('Theme changed to:', theme);
                this.applyTheme(theme);
                this.updateSetting('theme', theme);
            });
        }

        // Preferred agent
        const agentSelect = document.getElementById('preferred-agent-select');
        if (agentSelect) {
            agentSelect.addEventListener('change', (e) => {
                this.updateSetting('preferredAgent', e.target.value);
            });
        }

        // Currency selector
        const currencySelect = document.getElementById('currency-select');
        if (currencySelect) {
            currencySelect.addEventListener('change', (e) => {
                this.updateSetting('currency', e.target.value);
            });
        }

        // Max history
        const historySelect = document.getElementById('max-history-select');
        if (historySelect) {
            historySelect.addEventListener('change', (e) => {
                this.updateSetting('maxHistoryItems', parseInt(e.target.value));
            });
        }

        // Data management buttons
        const clearDataBtn = document.getElementById('clear-all-data');
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => this.clearAllData());
        }

        const exportBtn = document.getElementById('export-data');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        const importBtn = document.getElementById('import-data');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.importData());
        }

        // Import file input
        const fileInput = document.getElementById('import-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileImport(e));
        }

        // Listen for system theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', () => {
                const themeSelect = document.getElementById('theme-select');
                if (themeSelect && themeSelect.value === 'auto') {
                    this.applyTheme('auto');
                }
            });
        }
    }

    async updateSetting(key, value) {
        try {
            console.log('Updating setting:', key, '=', value);
            
            const updates = {};
            updates[key] = value;
            
            const response = await chrome.runtime.sendMessage({ 
                action: 'updateSettings', 
                updates 
            });
            
            if (response && response.success) {
                this.showSaveIndicator();
                console.log('Setting updated successfully');
            } else {
                console.error('Failed to update setting:', key);
            }
        } catch (error) {
            console.error('Error updating setting:', error);
        }
    }

    showSaveIndicator() {
        const indicator = document.getElementById('save-indicator');
        if (indicator) {
            indicator.classList.add('show');
            setTimeout(() => {
                indicator.classList.remove('show');
            }, 2000);
        }
    }

    async clearAllData() {
        if (!confirm('Are you sure you want to clear all data? This will delete your history, favorites, and reset all settings. This action cannot be undone.')) {
            return;
        }

        try {
            // Clear history and favorites
            await chrome.runtime.sendMessage({ action: 'clearHistory' });
            
            // Reset to defaults
            const defaultSettings = {
                autoConvert: true,
                preferredAgent: 'superbuy.com',
                currency: 'USD',
                theme: 'auto',
                enableCurrencyConversion: true,
                maxHistoryItems: 50,
                history: [],
                favorites: []
            };

            const response = await chrome.runtime.sendMessage({
                action: 'updateSettings',
                updates: defaultSettings
            });

            if (response && response.success) {
                alert('All data cleared successfully. The page will reload.');
                window.location.reload();
            }
        } catch (error) {
            console.error('Error clearing data:', error);
            alert('Error clearing data. Please try again.');
        }
    }

    async exportData() {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'exportData' });
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
                
                this.showSaveIndicator();
            }
        } catch (error) {
            console.error('Error exporting data:', error);
            alert('Error exporting data. Please try again.');
        }
    }

    importData() {
        const fileInput = document.getElementById('import-file-input');
        if (fileInput) {
            fileInput.click();
        }
    }

    async handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const response = await chrome.runtime.sendMessage({
                action: 'importData',
                data: text
            });

            if (response && response.success) {
                alert('Data imported successfully. The page will reload.');
                window.location.reload();
            } else {
                alert('Error importing data: ' + (response.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error importing data:', error);
            alert('Error reading file. Please check the file format.');
        }

        // Clear the file input
        event.target.value = '';
    }
}

// Initialize settings page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SettingsManager();
});