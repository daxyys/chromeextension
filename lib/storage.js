class ExtensionStorage {
    constructor() {
        this.defaults = {
            autoConvert: true,
            preferredAgent: 'superbuy.com',
            currency: 'USD',
            theme: 'auto',
            enableCurrencyConversion: true,
            maxHistoryItems: 50,
            history: [],
            favorites: []
        };
        
        // Throttle saves to avoid quota issues
        this.saveThrottle = null;
        this.pendingUpdates = {};
    }

    // Get settings with defaults
    async getSettings() {
        try {
            console.log('Storage: Getting settings...');
            // Use local storage instead of sync for better quota
            const result = await chrome.storage.local.get(this.defaults);
            console.log('Storage: Retrieved settings:', result);
            return result;
        } catch (error) {
            console.error('Storage: Error getting settings:', error);
            return this.defaults;
        }
    }

    // Update specific settings with throttling
    async updateSettings(updates) {
        try {
            console.log('Storage: Queuing settings update:', updates);
            
            // Add to pending updates
            Object.assign(this.pendingUpdates, updates);
            
            // Clear existing throttle
            if (this.saveThrottle) {
                clearTimeout(this.saveThrottle);
            }
            
            // Throttle saves to avoid quota exceeded
            this.saveThrottle = setTimeout(async () => {
                try {
                    console.log('Storage: Executing batched update:', this.pendingUpdates);
                    
                    // Use local storage instead of sync
                    await chrome.storage.local.set(this.pendingUpdates);
                    console.log('Storage: Settings updated successfully');
                    
                    // Clear pending updates
                    this.pendingUpdates = {};
                    this.saveThrottle = null;
                    
                } catch (error) {
                    console.error('Storage: Error in batched update:', error);
                }
            }, 500); // Wait 500ms before saving
            
            return true;
        } catch (error) {
            console.error('Storage: Error updating settings:', error);
            return false;
        }
    }

    // Add item to history with size management
    async addToHistory(item) {
        try {
            const settings = await this.getSettings();
            const history = settings.history || [];
            
            // Create compact history entry
            const historyEntry = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                originalUrl: item.originalUrl,
                convertedUrl: item.convertedUrl,
                fromAgent: item.fromAgent,
                toAgent: item.toAgent,
                platform: item.platform,
                itemId: item.itemId
            };

            // Add to beginning of array
            history.unshift(historyEntry);

            // Keep only max items (reduced to 50)
            const trimmedHistory = history.slice(0, settings.maxHistoryItems);

            // Use the throttled update method
            await this.updateSettings({ history: trimmedHistory });
            return historyEntry;
        } catch (error) {
            console.error('Error adding to history:', error);
            return null;
        }
    }

    // Get history
    async getHistory(limit = null) {
        try {
            const settings = await this.getSettings();
            const history = settings.history || [];
            return limit ? history.slice(0, limit) : history;
        } catch (error) {
            console.error('Error getting history:', error);
            return [];
        }
    }

    // Clear history
    async clearHistory() {
        try {
            await this.updateSettings({ history: [] });
            return true;
        } catch (error) {
            console.error('Error clearing history:', error);
            return false;
        }
    }

    // Add item to favorites
    async addToFavorites(item) {
        try {
            const settings = await this.getSettings();
            const favorites = settings.favorites || [];
            
            // Create favorite entry
            const favoriteEntry = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                url: item.url,
                title: item.title || '',
                notes: item.notes || '',
                tags: item.tags || [],
                platform: item.platform,
                itemId: item.itemId,
                agent: item.agent
            };

            // Check if already exists
            const exists = favorites.some(fav => fav.url === item.url);
            if (exists) {
                return { success: false, reason: 'already_exists' };
            }

            favorites.unshift(favoriteEntry);
            await this.updateSettings({ favorites });
            return { success: true, item: favoriteEntry };
        } catch (error) {
            console.error('Error adding to favorites:', error);
            return { success: false, reason: 'error' };
        }
    }

    // Get favorites
    async getFavorites() {
        try {
            const settings = await this.getSettings();
            return settings.favorites || [];
        } catch (error) {
            console.error('Error getting favorites:', error);
            return [];
        }
    }

    // Update favorite
    async updateFavorite(id, updates) {
        try {
            const settings = await this.getSettings();
            const favorites = settings.favorites || [];
            const index = favorites.findIndex(fav => fav.id === id);
            
            if (index !== -1) {
                favorites[index] = { ...favorites[index], ...updates };
                await this.updateSettings({ favorites });
                return { success: true, item: favorites[index] };
            }
            
            return { success: false, reason: 'not_found' };
        } catch (error) {
            console.error('Error updating favorite:', error);
            return { success: false, reason: 'error' };
        }
    }

    // Remove favorite
    async removeFavorite(id) {
        try {
            const settings = await this.getSettings();
            const favorites = settings.favorites || [];
            const filteredFavorites = favorites.filter(fav => fav.id !== id);
            
            await this.updateSettings({ favorites: filteredFavorites });
            return true;
        } catch (error) {
            console.error('Error removing favorite:', error);
            return false;
        }
    }

    // Search favorites
    async searchFavorites(query) {
        try {
            const favorites = await this.getFavorites();
            const lowerQuery = query.toLowerCase();
            
            return favorites.filter(fav => 
                fav.title.toLowerCase().includes(lowerQuery) ||
                fav.notes.toLowerCase().includes(lowerQuery) ||
                fav.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
                fav.url.toLowerCase().includes(lowerQuery)
            );
        } catch (error) {
            console.error('Error searching favorites:', error);
            return [];
        }
    }

    // Get statistics
    async getStats() {
        try {
            const settings = await this.getSettings();
            const history = settings.history || [];
            const favorites = settings.favorites || [];

            // Calculate stats
            const totalRedirects = history.length;
            const totalFavorites = favorites.length;
            
            // Most used agents
            const agentCounts = {};
            history.forEach(item => {
                if (item.toAgent) {
                    agentCounts[item.toAgent] = (agentCounts[item.toAgent] || 0) + 1;
                }
            });

            const mostUsedAgent = Object.entries(agentCounts)
                .sort(([,a], [,b]) => b - a)[0]?.[0] || null;

            // Recent activity (last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            const recentRedirects = history.filter(item => 
                new Date(item.timestamp) > sevenDaysAgo
            ).length;

            return {
                totalRedirects,
                totalFavorites,
                mostUsedAgent,
                recentRedirects,
                agentCounts
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            return {
                totalRedirects: 0,
                totalFavorites: 0,
                mostUsedAgent: null,
                recentRedirects: 0,
                agentCounts: {}
            };
        }
    }

    // Export data
    async exportData() {
        try {
            const settings = await this.getSettings();
            const exportData = {
                version: '1.0.0',
                exportDate: new Date().toISOString(),
                settings: {
                    autoConvert: settings.autoConvert,
                    preferredAgent: settings.preferredAgent,
                    currency: settings.currency,
                    theme: settings.theme,
                    enableCurrencyConversion: settings.enableCurrencyConversion,
                    maxHistoryItems: settings.maxHistoryItems
                },
                history: settings.history || [],
                favorites: settings.favorites || []
            };
            
            return JSON.stringify(exportData, null, 2);
        } catch (error) {
            console.error('Error exporting data:', error);
            return null;
        }
    }

    // Import data
    async importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            // Validate data structure
            if (!data.version || !data.settings) {
                throw new Error('Invalid import data format');
            }

            const updates = {
                autoConvert: data.settings.autoConvert,
                preferredAgent: data.settings.preferredAgent,
                currency: data.settings.currency,
                theme: data.settings.theme || 'auto',
                enableCurrencyConversion: data.settings.enableCurrencyConversion !== false,
                maxHistoryItems: data.settings.maxHistoryItems || 50,
                history: data.history || [],
                favorites: data.favorites || []
            };

            await this.updateSettings(updates);
            return { success: true };
        } catch (error) {
            console.error('Error importing data:', error);
            return { success: false, error: error.message };
        }
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.ExtensionStorage = ExtensionStorage;
}