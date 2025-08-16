// Content script for removing warnings and enhancing user experience

class ContentScriptManager {
    constructor() {
        this.converter = new ShippingAgentConverter();
        this.isGoogleDocs = window.location.hostname === 'docs.google.com';
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        // For Google Docs, we only want minimal functionality to avoid interfering
        // with Sheets' native link handling and other features
        if (this.isGoogleDocs) {
            console.log('On Google Docs - using minimal content script functionality');
            // Only enable basic parsing for the popup, skip all other features
            return;
        }
        
        // Full functionality for other sites
        this.removeWarnings();
        this.addCurrencyConversion();
        this.enhanceLinks();
        
        // Setup observers for dynamic content
        this.setupMutationObserver();
        
        // Initialize GTBuy specific warning removal
        if (window.location.hostname.includes('gtbuy.com')) {
            this.initGTBuyWarningRemoval();
        }
    }

    removeWarnings() {
        const currentDomain = window.location.hostname.toLowerCase();
        
        // Be more selective on Google Docs - only remove very specific warnings
        if (this.isGoogleDocs) {
            console.log('On Google Docs - using minimal warning removal');
            // Only remove warnings that might interfere with extension functionality
            // Don't remove Google's own dialogs/notifications
            return;
        }
        
        // Define warning selectors for different agents
        const warningSelectors = {
            'superbuy.com': [
                '.external-warning',
                '.link-warning',
                '[class*="warning"]',
                '[class*="alert"]'
            ],
            'sugargoo.com': [
                '.warning-modal',
                '.external-link-warning',
                '.popup-warning'
            ],
            'cnfans.com': [
                '.warning-popup',
                '.external-warning'
            ],
            'cssbuy.com': [
                '.warning-dialog',
                '.external-link-warning'
            ],
            'hoobuy.com': [
                '.warning-modal',
                '.link-warning'
            ],
            'gtbuy.com': [
                '.risk-warning',
                '.warning-popup',
                '.warning-modal',
                '.error-message',
                '.alert-warning',
                '.risk-popup',
                '.infringement-warning',
                '[class*="warning"]',
                '[class*="alert"]',
                '[class*="risk"]',
                '[class*="error"]',
                '#warning-modal',
                '#risk-popup',
                '#error-dialog'
            ],
            // Add more as needed
            'default': [
                '[class*="warning"]',
                '[class*="alert"]',
                '[class*="popup"]',
                '[class*="modal"]',
                '.warning',
                '.alert',
                '.popup',
                '.modal'
            ]
        };

        const selectorsToCheck = warningSelectors[currentDomain] || warningSelectors['default'];
        
        selectorsToCheck.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                // Check if it's actually a warning about external links or risks
                const text = element.textContent.toLowerCase();
                if (text.includes('external') || 
                    text.includes('warning') || 
                    text.includes('redirect') ||
                    text.includes('leaving') ||
                    text.includes('risk') ||
                    text.includes('infringement') ||
                    text.includes('暂不支持') ||
                    text.includes('suspected') ||
                    text.includes('unable to purchase') ||
                    text.includes('greetings')) {
                    this.dismissElement(element);
                }
            });
        });

        // Remove sign-in prompts that appear on agent pages
        this.removeSignInPrompts();
        
        // Remove overlays and backdrops
        this.removeOverlays();
    }

    // ... rest of the methods remain the same until addCurrencyConversion

    async addCurrencyConversion() {
        // Skip currency conversion on Google Docs to avoid modifying spreadsheet data
        if (this.isGoogleDocs) {
            console.log('Skipping currency conversion on Google Docs to preserve data integrity');
            return;
        }

        try {
            console.log('Currency conversion: Starting...');
            
            // Get user's preferred currency
            const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
            if (!response || !response.success) {
                console.log('Currency conversion: Failed to get settings');
                return;
            }

            const currency = response.settings.currency;
            console.log('Currency conversion: Target currency is', currency);
            
            if (currency === 'CNY') {
                console.log('Currency conversion: Target is CNY, no conversion needed');
                return; // No conversion needed
            }

            // Find price elements and add conversion
            await this.convertPricesOnPage(currency);
        } catch (error) {
            console.error('Error adding currency conversion:', error);
        }
    }

    // ... convertPricesOnPage and other currency methods remain the same

    enhanceLinks() {
        // Skip link enhancement on Google Docs to avoid interfering with spreadsheet functionality
        if (this.isGoogleDocs) {
            console.log('Skipping link enhancement on Google Docs to preserve native link behavior');
            return;
        }

        // Add hover effects and quick convert options to supported links
        const links = document.querySelectorAll('a[href]');
        
        links.forEach(link => {
            const href = link.getAttribute('href');
            const parsed = this.converter.parseUrl(href);
            
            if (parsed) {
                // Add a small indicator that this link can be converted
                link.style.position = 'relative';
                link.addEventListener('mouseenter', () => this.showLinkTooltip(link, parsed));
                link.addEventListener('mouseleave', () => this.hideLinkTooltip(link));
            }
        });
    }

    // ... rest of methods remain the same

    setupMutationObserver() {
        // Skip mutation observer on Google Docs to avoid interfering with Sheets functionality
        if (this.isGoogleDocs) {
            console.log('Skipping mutation observer on Google Docs');
            return;
        }

        // Watch for dynamically added content
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Re-run our enhancement functions on new content
                            this.removeWarningsInElement(node);
                            this.enhanceLinksInElement(node);
                            
                            // GTBuy specific handling
                            if (window.location.hostname.includes('gtbuy.com')) {
                                const text = node.textContent?.toLowerCase() || '';
                                if (text.includes('risk') || text.includes('warning') || text.includes('暂不支持')) {
                                    setTimeout(() => this.dismissElement(node), 100);
                                }
                            }
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    removeWarningsInElement(element) {
        // Skip aggressive warning removal on Google Docs
        if (this.isGoogleDocs) {
            return;
        }

        // Similar to removeWarnings but scoped to a specific element
        const warnings = element.querySelectorAll('[class*="warning"], [class*="alert"], [class*="popup"], [class*="risk"]');
        warnings.forEach(warning => {
            const text = warning.textContent.toLowerCase();
            if (text.includes('external') || text.includes('warning') || text.includes('redirect') || 
                text.includes('risk') || text.includes('infringement') || text.includes('暂不支持')) {
                this.dismissElement(warning);
            }
        });
    }

    enhanceLinksInElement(element) {
        // Skip on Google Docs
        if (this.isGoogleDocs) {
            return;
        }

        const links = element.querySelectorAll('a[href]');
        links.forEach(link => {
            const href = link.getAttribute('href');
            const parsed = this.converter.parseUrl(href);
            
            if (parsed) {
                link.addEventListener('mouseenter', () => this.showLinkTooltip(link, parsed));
                link.addEventListener('mouseleave', () => this.hideLinkTooltip(link));
            }
        });
    }

    // ... rest of methods remain exactly the same
}

// Initialize content script
new ContentScriptManager();