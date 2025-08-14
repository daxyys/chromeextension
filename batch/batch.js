// Batch Convert Page Script

class BatchConverter {
    constructor() {
        this.converter = new ShippingAgentConverter();
        this.storage = new ExtensionStorage();
        this.results = [];
        this.init();
    }

    async init() {
        console.log('Batch converter initializing...');
        
        await this.loadSettings();
        this.populateAgentSelector();
        this.setupEventListeners();
        this.setupTheme();
        
        console.log('Batch converter initialized');
    }

    async loadSettings() {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
            if (response && response.success) {
                const settings = response.settings;
                
                // Set preferred agent
                const agentSelect = document.getElementById('target-agent');
                if (agentSelect && settings.preferredAgent) {
                    agentSelect.value = settings.preferredAgent;
                }
                
                // Apply theme
                if (settings.theme) {
                    this.applyTheme(settings.theme);
                }
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    populateAgentSelector() {
        const agentSelect = document.getElementById('target-agent');
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

    setupEventListeners() {
        // URL input monitoring
        const urlInput = document.getElementById('batch-urls');
        if (urlInput) {
            urlInput.addEventListener('input', () => this.updateUrlCount());
            urlInput.addEventListener('paste', () => {
                // Small delay to let paste complete
                setTimeout(() => this.updateUrlCount(), 100);
            });
        }

        // Paste from clipboard
        const pasteBtn = document.getElementById('paste-clipboard');
        if (pasteBtn) {
            pasteBtn.addEventListener('click', () => this.pasteFromClipboard());
        }

        // Clear input
        const clearBtn = document.getElementById('clear-input');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearInput());
        }

        // Convert batch
        const convertBtn = document.getElementById('convert-batch');
        if (convertBtn) {
            convertBtn.addEventListener('click', () => this.performBatchConvert());
        }

        // Results actions
        const copySuccessfulBtn = document.getElementById('copy-successful');
        if (copySuccessfulBtn) {
            copySuccessfulBtn.addEventListener('click', () => this.copySuccessful());
        }

        const copyAllBtn = document.getElementById('copy-all-results');
        if (copyAllBtn) {
            copyAllBtn.addEventListener('click', () => this.copyAll());
        }

        const openAllBtn = document.getElementById('open-all');
        if (openAllBtn) {
            openAllBtn.addEventListener('click', () => this.openAll());
        }

        // Back to popup
        const backBtn = document.getElementById('back-to-popup');
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.close();
            });
        }
    }

    setupTheme() {
        // Detect system theme if auto
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', () => {
                this.loadSettings(); // Reload settings to apply theme
            });
        }
    }

    applyTheme(theme) {
        const body = document.body;
        
        // Remove any existing theme attributes
        body.removeAttribute('data-theme');
        
        if (theme === 'dark') {
            body.setAttribute('data-theme', 'dark');
        } else if (theme === 'light') {
            body.setAttribute('data-theme', 'light');
        } else { // auto
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            body.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        }
    }

    updateUrlCount() {
        const urlInput = document.getElementById('batch-urls');
        const countElement = document.getElementById('url-count');
        
        if (!urlInput || !countElement) return;
        
        const text = urlInput.value.trim();
        const urls = text ? text.split('\n').filter(line => line.trim()) : [];
        
        countElement.textContent = `${urls.length} URL${urls.length !== 1 ? 's' : ''} detected`;
    }

    async pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            const urlInput = document.getElementById('batch-urls');
            
            if (urlInput) {
                // If input is empty, paste directly. If not, append with newline
                const currentValue = urlInput.value.trim();
                urlInput.value = currentValue ? currentValue + '\n' + text : text;
                this.updateUrlCount();
                
                // Show feedback
                const pasteBtn = document.getElementById('paste-clipboard');
                if (pasteBtn) {
                    const originalText = pasteBtn.textContent;
                    pasteBtn.textContent = '✅ Pasted!';
                    setTimeout(() => {
                        pasteBtn.textContent = originalText;
                    }, 2000);
                }
            }
        } catch (error) {
            console.error('Error pasting from clipboard:', error);
            alert('Could not access clipboard. Please paste manually with Ctrl+V.');
        }
    }

    clearInput() {
        const urlInput = document.getElementById('batch-urls');
        const resultsSection = document.getElementById('results-section');
        
        if (urlInput) {
            urlInput.value = '';
            this.updateUrlCount();
        }
        
        if (resultsSection) {
            resultsSection.style.display = 'none';
        }
        
        this.results = [];
    }

    async performBatchConvert() {
        const urlInput = document.getElementById('batch-urls');
        const agentSelect = document.getElementById('target-agent');
        const convertBtn = document.getElementById('convert-batch');
        
        if (!urlInput || !agentSelect || !convertBtn) return;
        
        const text = urlInput.value.trim();
        if (!text) {
            alert('Please enter some URLs to convert.');
            return;
        }
        
        let urls = text.split('\n').filter(line => line.trim());
        const targetAgent = agentSelect.value;
        
        // Remove duplicates if enabled
        const removeDuplicates = document.getElementById('remove-duplicates')?.checked;
        if (removeDuplicates) {
            urls = [...new Set(urls)];
        }
        
        if (urls.length === 0) {
            alert('No valid URLs found.');
            return;
        }
        
        // Show loading state
        convertBtn.disabled = true;
        convertBtn.textContent = '🔄 Converting...';
        convertBtn.classList.add('loading');
        
        try {
            // Perform batch conversion
            const response = await chrome.runtime.sendMessage({
                action: 'batchConvert',
                urls: urls,
                targetAgent: targetAgent
            });
            
            if (response && response.success) {
                this.results = response.results;
                this.displayResults();
            } else {
                throw new Error('Batch conversion failed');
            }
        } catch (error) {
            console.error('Error during batch conversion:', error);
            alert('Error during conversion. Please try again.');
        } finally {
            // Restore button state
            convertBtn.disabled = false;
            convertBtn.textContent = '🔄 Convert All URLs';
            convertBtn.classList.remove('loading');
        }
    }

    displayResults() {
        const resultsSection = document.getElementById('results-section');
        const resultsList = document.getElementById('results-list');
        const successfulCount = document.getElementById('successful-count');
        const failedCount = document.getElementById('failed-count');
        const totalCount = document.getElementById('total-count');
        
        if (!resultsSection || !resultsList) return;
        
        // Calculate stats
        const successful = this.results.filter(r => r.converted).length;
        const failed = this.results.filter(r => !r.converted).length;
        const total = this.results.length;
        
        // Update stats
        if (successfulCount) successfulCount.textContent = successful;
        if (failedCount) failedCount.textContent = failed;
        if (totalCount) totalCount.textContent = total;
        
        // Clear and populate results
        resultsList.innerHTML = '';
        
        this.results.forEach((result, index) => {
            const resultItem = document.createElement('div');
            resultItem.className = `result-item ${result.converted ? 'success' : 'error'}`;
            
            const originalDiv = document.createElement('div');
            originalDiv.className = 'result-original';
            originalDiv.textContent = `${index + 1}. ${result.original}`;
            
            const resultDiv = document.createElement('div');
            if (result.converted) {
                resultDiv.className = 'result-converted';
                resultDiv.textContent = result.converted;
            } else {
                resultDiv.className = 'result-error';
                resultDiv.textContent = 'Could not convert this URL';
            }
            
            resultItem.appendChild(originalDiv);
            resultItem.appendChild(resultDiv);
            
            // Add action buttons for successful conversions
            if (result.converted) {
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'result-actions';
                
                const copyBtn = document.createElement('button');
                copyBtn.className = 'btn btn-secondary';
                copyBtn.textContent = '📋 Copy';
                copyBtn.onclick = () => this.copyUrl(result.converted, copyBtn);
                
                const openBtn = document.createElement('button');
                openBtn.className = 'btn btn-secondary';
                openBtn.textContent = '🔗 Open';
                openBtn.onclick = () => this.openUrl(result.converted);
                
                actionsDiv.appendChild(copyBtn);
                actionsDiv.appendChild(openBtn);
                resultItem.appendChild(actionsDiv);
            }
            
            resultsList.appendChild(resultItem);
        });
        
        // Show results section
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    copySuccessful() {
        const successfulUrls = this.results
            .filter(r => r.converted)
            .map(r => r.converted)
            .join('\n');
        
        if (successfulUrls) {
            this.copyToClipboard(successfulUrls, 'copy-successful');
        } else {
            alert('No successful conversions to copy.');
        }
    }

    copyAll() {
        const allResults = this.results.map(r => {
            if (r.converted) {
                return `${r.converted} `;
            } else {
                return `${r.original} (failed) `;
            }
        }).join('\n');
        
        if (allResults) {
            this.copyToClipboard(allResults, 'copy-all-results');
        } else {
            alert('No results to copy.');
        }
    }

    openAll() {
        const successfulUrls = this.results
            .filter(r => r.converted)
            .map(r => r.converted);
        
        if (successfulUrls.length === 0) {
            alert('No successful conversions to open.');
            return;
        }
        
        if (successfulUrls.length > 10) {
            if (!confirm(`This will open ${successfulUrls.length} tabs. Are you sure?`)) {
                return;
            }
        }
        
        successfulUrls.forEach(url => {
            chrome.tabs.create({ url: url });
        });
    }

    copyUrl(url, button) {
        this.copyToClipboard(url);
        
        // Show feedback on the specific button
        const originalText = button.textContent;
        button.textContent = '✅ Copied!';
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    }

    openUrl(url) {
        chrome.tabs.create({ url: url });
    }

    async copyToClipboard(text, buttonId = null) {
        try {
            await navigator.clipboard.writeText(text);
            
            // Show feedback
            if (buttonId) {
                const button = document.getElementById(buttonId);
                if (button) {
                    const originalText = button.textContent;
                    button.textContent = '✅ Copied!';
                    setTimeout(() => {
                        button.textContent = originalText;
                    }, 2000);
                }
            }
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            // Fallback: select text for manual copy
            this.selectText(text);
        }
    }

    selectText(text) {
        // Create a temporary textarea to select text for manual copying
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            document.execCommand('copy');
            alert('Results copied to clipboard!');
        } catch (error) {
            alert('Could not copy automatically. Please select and copy manually.');
        }
        
        document.body.removeChild(textarea);
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

// Initialize batch converter when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing batch converter...');
    
    // Check if Chrome extension API is available
    if (typeof chrome === 'undefined' || !chrome.runtime) {
        console.error('Chrome extension API not available');
        document.body.innerHTML = `
            <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
                <h2>Extension Context Required</h2>
                <p>This page must be opened from the browser extension.</p>
                <button onclick="window.close()" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>
            </div>
        `;
        return;
    }
    
    try {
        new BatchConverter();
    } catch (error) {
        console.error('Error initializing batch converter:', error);
    }
});