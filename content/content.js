// Content script for removing warnings and enhancing user experience

class ContentScriptManager {
    constructor() {
        this.converter = new ShippingAgentConverter();
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
        this.removeWarnings();
        this.addCurrencyConversion();
        this.enhanceLinks();
        
        // Setup observers for dynamic content
        this.setupMutationObserver();
    }

    removeWarnings() {
        const currentDomain = window.location.hostname.toLowerCase();
        
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
                // Check if it's actually a warning about external links
                const text = element.textContent.toLowerCase();
                if (text.includes('external') || 
                    text.includes('warning') || 
                    text.includes('redirect') ||
                    text.includes('leaving')) {
                    this.dismissElement(element);
                }
            });
        });

        // Remove sign-in prompts that appear on agent pages
        this.removeSignInPrompts();
    }

    dismissElement(element) {
        // Try different methods to dismiss the element
        
        // Method 1: Find and click close/dismiss buttons
        const closeButtons = element.querySelectorAll('button, [class*="close"], [class*="dismiss"], [class*="cancel"]');
        closeButtons.forEach(button => {
            const buttonText = button.textContent.toLowerCase();
            if (buttonText.includes('close') || 
                buttonText.includes('dismiss') || 
                buttonText.includes('cancel') ||
                buttonText.includes('×') ||
                buttonText.includes('ok')) {
                button.click();
                return;
            }
        });

        // Method 2: Hide the element
        element.style.display = 'none';
        
        // Method 3: Remove from DOM
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }, 100);
    }

    removeSignInPrompts() {
        // Common sign-in prompt selectors
        const signInSelectors = [
            '[class*="login"]',
            '[class*="signin"]',
            '[class*="auth"]',
            '.login-popup',
            '.signin-modal',
            '.auth-modal'
        ];

        signInSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                const text = element.textContent.toLowerCase();
                if (text.includes('sign in') || 
                    text.includes('log in') || 
                    text.includes('login') ||
                    text.includes('register')) {
                    
                    // Try to find a "skip" or "continue without" button first
                    const skipButtons = element.querySelectorAll('button, a');
                    let skipped = false;
                    
                    skipButtons.forEach(button => {
                        const buttonText = button.textContent.toLowerCase();
                        if (buttonText.includes('skip') || 
                            buttonText.includes('continue') ||
                            buttonText.includes('later') ||
                            buttonText.includes('guest')) {
                            button.click();
                            skipped = true;
                        }
                    });

                    // If no skip button found, hide the prompt
                    if (!skipped) {
                        this.dismissElement(element);
                    }
                }
            });
        });
    }

    async addCurrencyConversion() {
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

    async convertPricesOnPage(targetCurrency) {
        console.log('Currency conversion: Converting prices on page to', targetCurrency);
        
        // Get exchange rate first
        const exchangeRate = await this.getExchangeRate('CNY', targetCurrency);
        if (!exchangeRate) {
            console.log('Currency conversion: No exchange rate available, skipping');
            return;
        }

        console.log('Currency conversion: Using rate', exchangeRate);

        // Find all text containing ¥ symbol OR "CNY"
        const allElements = document.querySelectorAll('*');
        let convertedCount = 0;
        
        allElements.forEach(element => {
            // Skip if already processed or is a script/style element
            if (element.hasAttribute('data-converted') || 
                element.tagName === 'SCRIPT' || 
                element.tagName === 'STYLE' ||
                element.children.length > 0) { // Skip parent elements, only process leaf elements
                return;
            }
            
            const text = element.textContent;
            if (text && (text.includes('¥') || text.includes('CNY'))) {
                const converted = this.convertElementPrice(element, exchangeRate, targetCurrency);
                if (converted) {
                    convertedCount++;
                }
            }
        });
        
        console.log(`Currency conversion: Converted ${convertedCount} price elements`);
        
        // Also try common price selectors
        const priceSelectors = [
            '.price',
            '.cost',
            '.amount',
            '[class*="price"]',
            '[class*="cost"]',
            '[class*="amount"]'
        ];

        priceSelectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    if (!element.hasAttribute('data-converted') && 
                        (element.textContent.includes('¥') || element.textContent.includes('CNY'))) {
                        const converted = this.convertElementPrice(element, exchangeRate, targetCurrency);
                        if (converted) {
                            convertedCount++;
                        }
                    }
                });
            } catch (error) {
                console.warn('Currency conversion: Error with selector:', selector, error);
            }
        });
        
        console.log(`Currency conversion: Total converted ${convertedCount} elements`);
    }

    async getExchangeRate(from, to) {
        try {
            console.log(`Currency conversion: Fetching ${from} to ${to} rate...`);
            
            // Try exchangerate-api.com first
            const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
            if (response.ok) {
                const data = await response.json();
                const rate = data.rates[to];
                console.log(`Currency conversion: Rate ${from} to ${to} = ${rate}`);
                return rate;
            }
            
            console.log('Currency conversion: exchangerate-api.com failed, trying fallback...');
            
            // Fallback to a different API
            const fallbackResponse = await fetch(`https://api.fxratesapi.com/latest?base=${from}&symbols=${to}`);
            if (fallbackResponse.ok) {
                const fallbackData = await fallbackResponse.json();
                const rate = fallbackData.rates[to];
                console.log(`Currency conversion: Fallback rate ${from} to ${to} = ${rate}`);
                return rate;
            }
            
            console.error('Currency conversion: All APIs failed');
            return null;
        } catch (error) {
            console.error('Currency conversion: Error fetching exchange rate:', error);
            
            // Static fallback rates (approximate, for testing)
            const staticRates = {
                'CNY_USD': 0.14,
                'CNY_EUR': 0.13,
                'CNY_GBP': 0.11,
                'CNY_CAD': 0.19
            };
            
            const rateKey = `${from}_${to}`;
            if (staticRates[rateKey]) {
                console.log(`Currency conversion: Using static fallback rate ${rateKey} = ${staticRates[rateKey]}`);
                return staticRates[rateKey];
            }
            
            return null;
        }
    }

    convertElementPrice(element, rate, currency) {
        const text = element.textContent;
        // Updated regex to handle both ¥ symbol and "CNY" text
        const priceRegexes = [
            /¥\s*(\d+(?:[.,]\d+)?)/g,           // ¥128.50 or ¥ 128.50
            /CNY\s*(\d+(?:[.,]\d+)?)/gi,        // CNY 128.50 or cny128.50
            /(\d+(?:[.,]\d+)?)\s*¥/g,           // 128.50¥
            /(\d+(?:[.,]\d+)?)\s*CNY/gi         // 128.50 CNY
        ];
        
        let hasConverted = false;

        // Skip if already converted
        if (element.hasAttribute('data-converted')) {
            return false;
        }

        console.log('Currency conversion: Processing element with text:', text.substring(0, 100));

        // Try each regex pattern
        priceRegexes.forEach((priceRegex, index) => {
            let match;
            while ((match = priceRegex.exec(text)) !== null) {
                const cnyPriceStr = match[1].replace(',', ''); // Handle comma separators
                const cnyPrice = parseFloat(cnyPriceStr);
                
                console.log(`Currency conversion: Found price pattern ${index}: ${match[0]} (${cnyPrice})`);
                
                if (cnyPrice && cnyPrice > 0 && cnyPrice < 1000000) { // Reasonable price range
                    const convertedPrice = (cnyPrice * rate).toFixed(2);
                    const currencySymbol = this.getCurrencySymbol(currency);
                    
                    // Create a tooltip
                    const convertedText = `${currencySymbol}${convertedPrice}`;
                    element.title = `${match[0]} ≈ ${convertedText}`;
                    
                    console.log('Currency conversion: Converted ' + match[0] + ' to ' + convertedText);
                    
                    // Add visual indicator by updating the HTML
                    try {
                        const newHTML = element.innerHTML.replace(
                            match[0], 
                            `${match[0]} <span class="agent-redirector-price-converted" style="color: #666; font-size: 0.9em; font-weight: normal;">(≈${convertedText})</span>`
                        );
                        
                        // Only update if the replacement actually changed something
                        if (newHTML !== element.innerHTML) {
                            element.innerHTML = newHTML;
                            hasConverted = true;
                        }
                    } catch (error) {
                        console.warn('Currency conversion: Could not update HTML, using tooltip only');
                    }
                }
            }
        });

        // Mark as converted to avoid processing again
        if (hasConverted) {
            element.setAttribute('data-converted', 'true');
            console.log('Currency conversion: Element marked as converted');
        }
        
        return hasConverted;
    }

    getCurrencySymbol(currency) {
        const symbols = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'CAD': 'C$',
            'AUD': 'A$',
            'JPY': '¥'
        };
        return symbols[currency] || currency;
    }

    enhanceLinks() {
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

    showLinkTooltip(link, parsed) {
        // Create tooltip showing link info
        const tooltip = document.createElement('div');
        tooltip.className = 'agent-redirector-tooltip';
        tooltip.innerHTML = `
            <div style="
                position: absolute;
                background: #333;
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                z-index: 10000;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                white-space: nowrap;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            ">
                ${parsed.type === 'agent' ? 'Agent' : 'Original'}: ${parsed.platform || parsed.agent}
                <br>Item: ${parsed.itemId}
            </div>
        `;
        
        link.appendChild(tooltip);
    }

    hideLinkTooltip(link) {
        const tooltip = link.querySelector('.agent-redirector-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    setupMutationObserver() {
        // Watch for dynamically added content
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Re-run our enhancement functions on new content
                            this.removeWarningsInElement(node);
                            this.enhanceLinksInElement(node);
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
        // Similar to removeWarnings but scoped to a specific element
        const warnings = element.querySelectorAll('[class*="warning"], [class*="alert"], [class*="popup"]');
        warnings.forEach(warning => {
            const text = warning.textContent.toLowerCase();
            if (text.includes('external') || text.includes('warning') || text.includes('redirect')) {
                this.dismissElement(warning);
            }
        });
    }

    enhanceLinksInElement(element) {
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
}

// Initialize content script
new ContentScriptManager();