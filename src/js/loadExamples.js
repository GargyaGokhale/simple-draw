/**
 * LoadExamples module handles loading, parsing, and displaying Mermaid diagram examples.
 * Provides functionality to fetch examples from external files, parse markdown format,
 * generate accessible HTML components, and handle user interactions.
 * 
 * @module LoadExamples
 * @author Gargya Gokhale
 * @version 1.0.0
 */

import { sanitizeInput } from './utils/sanitizer.js';

/**
 * LoadExamples class manages the loading and display of Mermaid diagram examples.
 * Handles fetching, parsing, rendering, and user interactions with example snippets.
 * 
 * @class LoadExamples
 */
export class LoadExamples {
    // Configuration constants
    static CONFIG = {
        EXAMPLES_FILE: 'examples.txt',
        MAX_FILE_SIZE: 1024 * 1024, // 1MB limit
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000, // 1 second
        COPY_SUCCESS_DURATION: 2000, // 2 seconds
        GITHUB_PAGES_PATH: '/simple-draw/',
        LOCAL_PATH: '/'
    };

    // HTML templates and CSS classes
    static TEMPLATES = {
        CONTAINER: 'examples-container',
        SNIPPET: 'snippet',
        HEADER: 'snippet-header',
        CODE_CONTAINER: 'code-container',
        CODE_HEADER: 'code-header',
        CODE_BLOCK: 'code-block',
        EXAMPLE_CODE: 'example-code',
        COPY_BTN: 'copy-btn',
        USE_BTN: 'use-btn'
    };

    // Regex patterns
    static PATTERNS = {
        EXAMPLE_PARSER: /## (.+?)\n```mermaid\n([\s\S]+?)```/g,
        TITLE_SANITIZER: /[<>&"']/g,
        WHITESPACE_CLEANER: /^\s+|\s+$/g
    };

    // Error messages
    static ERROR_MESSAGES = {
        FETCH_FAILED: 'Failed to fetch examples file',
        PARSE_FAILED: 'Failed to parse examples content',
        NO_EXAMPLES: 'No examples found in the file',
        FILE_TOO_LARGE: 'Examples file is too large',
        INVALID_CONTENT: 'Invalid examples file content',
        CLIPBOARD_FAILED: 'Failed to copy to clipboard',
        ELEMENT_NOT_FOUND: 'Required element not found'
    };

    /**
     * Creates an instance of LoadExamples.
     * 
     * @constructor
     * @param {Object} [options={}] - Configuration options
     * @param {string} [options.examplesFile] - Path to examples file
     * @param {number} [options.maxFileSize] - Maximum file size in bytes
     * @param {number} [options.retryAttempts] - Number of retry attempts
     * @param {Function} [options.clipboardHandler] - Custom clipboard handler function
     */
    constructor(options = {}) {
        // Configuration with defaults
        this.config = {
            examplesFile: options.examplesFile || LoadExamples.CONFIG.EXAMPLES_FILE,
            maxFileSize: options.maxFileSize || LoadExamples.CONFIG.MAX_FILE_SIZE,
            retryAttempts: options.retryAttempts || LoadExamples.CONFIG.RETRY_ATTEMPTS,
            clipboardHandler: options.clipboardHandler || this._defaultClipboardHandler.bind(this)
        };

        // Internal state
        this.examples = [];
        this.isLoaded = false;
        this.eventListeners = new Map();
        
        // Setup event delegation
        this._setupEventDelegation();
        
        console.log('LoadExamples initialized successfully');
    }

    /**
     * Sets up event delegation for dynamic content.
     * 
     * @private
     */
    _setupEventDelegation() {
        const clickHandler = this._handleDocumentClick.bind(this);
        document.addEventListener('click', clickHandler);
        
        // Track event listener for cleanup
        this.eventListeners.set('document-click', {
            element: document,
            event: 'click',
            handler: clickHandler
        });
    }

    /**
     * Handles document click events with delegation.
     * 
     * @private
     * @param {Event} event - The click event
     */
    async _handleDocumentClick(event) {
        try {
            // Handle copy button clicks
            if (event.target.closest(`.${LoadExamples.TEMPLATES.COPY_BTN}`)) {
                await this._handleCopyClick(event);
                return;
            }

            // Handle use example button clicks
            if (event.target.classList.contains(LoadExamples.TEMPLATES.USE_BTN)) {
                await this._handleUseExampleClick(event);
                return;
            }
        } catch (error) {
            console.error('Error handling click event:', error);
        }
    }

    /**
     * Handles copy button click events.
     * 
     * @private
     * @param {Event} event - The click event
     */
    async _handleCopyClick(event) {
        const button = event.target.closest(`.${LoadExamples.TEMPLATES.COPY_BTN}`);
        const codeBlock = button.closest(`.${LoadExamples.TEMPLATES.CODE_CONTAINER}`)
            .querySelector(`.${LoadExamples.TEMPLATES.EXAMPLE_CODE}`);
        
        if (!codeBlock) {
            throw new Error(LoadExamples.ERROR_MESSAGES.ELEMENT_NOT_FOUND);
        }

        const codeText = codeBlock.textContent.trim();
        const originalContent = button.innerHTML;

        try {
            await this.config.clipboardHandler(codeText);
            
            // Show success feedback
            button.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i>';
            button.setAttribute('aria-label', 'Code copied successfully');
            
            // Reset button after delay
            setTimeout(() => {
                button.innerHTML = originalContent;
                button.setAttribute('aria-label', 'Copy code');
            }, LoadExamples.CONFIG.COPY_SUCCESS_DURATION);
            
        } catch (error) {
            console.error('Copy failed:', error);
            // Show error feedback
            button.innerHTML = '<i class="fas fa-times" aria-hidden="true"></i>';
            setTimeout(() => {
                button.innerHTML = originalContent;
            }, LoadExamples.CONFIG.COPY_SUCCESS_DURATION);
        }
    }

    /**
     * Handles use example button click events.
     * 
     * @private
     * @param {Event} event - The click event
     */
    async _handleUseExampleClick(event) {
        const button = event.target;
        const codeBlock = button.closest(`.${LoadExamples.TEMPLATES.SNIPPET}`)
            .querySelector(`.${LoadExamples.TEMPLATES.EXAMPLE_CODE}`);
        
        if (!codeBlock) {
            throw new Error(LoadExamples.ERROR_MESSAGES.ELEMENT_NOT_FOUND);
        }

        const codeText = codeBlock.textContent.trim();
        const textarea = document.getElementById('mermaidInput');
        
        if (!textarea) {
            throw new Error('Mermaid input textarea not found');
        }

        // Set the code in the textarea
        textarea.value = codeText;
        
        // Close the info popup if it exists
        const infoPopup = document.querySelector('.info-popup');
        if (infoPopup) {
            infoPopup.classList.remove('active');
        }
        
        // Trigger render automatically
        const renderBtn = document.getElementById('renderBtn');
        if (renderBtn) {
            renderBtn.click();
        }

        // Show success feedback
        button.textContent = 'Applied!';
        setTimeout(() => {
            button.textContent = 'Use This Example';
        }, LoadExamples.CONFIG.COPY_SUCCESS_DURATION);
    }

    /**
     * Default clipboard handler using the Clipboard API.
     * 
     * @private
     * @param {string} text - Text to copy to clipboard
     * @throws {Error} If clipboard operation fails
     */
    async _defaultClipboardHandler(text) {
        if (!navigator.clipboard) {
            throw new Error('Clipboard API not supported');
        }
        return await navigator.clipboard.writeText(text);
    }

    /**
     * Determines the correct base path for fetching examples.
     * 
     * @private
     * @returns {string} The base path for the current environment
     */
    _getBasePath() {
        return window.location.hostname === 'gargyagokhale.github.io' 
            ? LoadExamples.CONFIG.GITHUB_PAGES_PATH 
            : LoadExamples.CONFIG.LOCAL_PATH;
    }

    /**
     * Fetches the examples file with retry logic.
     * 
     * @private
     * @param {number} [attempt=1] - Current attempt number
     * @returns {Promise<string>} The fetched content
     * @throws {Error} If fetch fails after all retries
     */
    async _fetchExamplesFile(attempt = 1) {
        const basePath = this._getBasePath();
        const url = `${basePath}${this.config.examplesFile}`;
        
        try {
            console.log(`Fetching examples (attempt ${attempt}): ${url}`);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Check content length
            const contentLength = response.headers.get('content-length');
            if (contentLength && parseInt(contentLength) > this.config.maxFileSize) {
                throw new Error(LoadExamples.ERROR_MESSAGES.FILE_TOO_LARGE);
            }

            const content = await response.text();
            
            // Validate content size after fetch
            if (content.length > this.config.maxFileSize) {
                throw new Error(LoadExamples.ERROR_MESSAGES.FILE_TOO_LARGE);
            }

            console.log('Successfully fetched examples file');
            return content;

        } catch (error) {
            console.warn(`Fetch attempt ${attempt} failed:`, error.message);
            
            if (attempt < this.config.retryAttempts) {
                // Wait before retry
                await this._delay(LoadExamples.CONFIG.RETRY_DELAY * attempt);
                return this._fetchExamplesFile(attempt + 1);
            }
            
            throw new Error(`${LoadExamples.ERROR_MESSAGES.FETCH_FAILED}: ${error.message}`);
        }
    }

    /**
     * Utility function to create a delay.
     * 
     * @private
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise<void>}
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Parses the examples content and extracts snippets.
     * 
     * @private
     * @param {string} content - The raw content to parse
     * @returns {Array<Object>} Array of example snippets
     * @throws {Error} If parsing fails
     */
    _parseExamples(content) {
        if (!content || typeof content !== 'string') {
            throw new Error(LoadExamples.ERROR_MESSAGES.INVALID_CONTENT);
        }

        const snippets = [];
        const regex = LoadExamples.PATTERNS.EXAMPLE_PARSER;
        let match;
        
        console.log('Parsing examples content...');
        
        while ((match = regex.exec(content)) !== null) {
            try {
                const title = this._sanitizeTitle(match[1]);
                const code = this._sanitizeCode(match[2]);
                
                if (title && code) {
                    snippets.push({ title, code });
                    console.log(`Parsed example: ${title}`);
                }
            } catch (error) {
                console.warn('Failed to parse example snippet:', error);
                // Continue parsing other examples
            }
        }

        if (snippets.length === 0) {
            throw new Error(LoadExamples.ERROR_MESSAGES.NO_EXAMPLES);
        }

        console.log(`Successfully parsed ${snippets.length} examples`);
        return snippets;
    }

    /**
     * Sanitizes example titles to prevent XSS.
     * 
     * @private
     * @param {string} title - The title to sanitize
     * @returns {string} Sanitized title
     */
    _sanitizeTitle(title) {
        if (!title) return '';
        return sanitizeInput(title.trim());
    }

    /**
     * Sanitizes and validates example code.
     * 
     * @private
     * @param {string} code - The code to sanitize
     * @returns {string} Sanitized code
     */
    _sanitizeCode(code) {
        if (!code) return '';
        
        // Basic sanitization and trimming
        let sanitized = code.replace(LoadExamples.PATTERNS.WHITESPACE_CLEANER, '');
        
        // Additional validation could be added here
        // For now, we trust the examples file content
        
        return sanitized;
    }

    /**
     * Generates HTML for a single example snippet.
     * 
     * @private
     * @param {Object} snippet - The snippet object
     * @param {number} index - The snippet index
     * @returns {string} HTML string for the snippet
     */
    _generateSnippetHTML(snippet, index) {
        const { title, code } = snippet;
        const snippetId = `snippet-${index}`;
        const codeId = `code-${index}`;
        
        return `
            <div class="${LoadExamples.TEMPLATES.SNIPPET}" id="${snippetId}">
                <div class="${LoadExamples.TEMPLATES.HEADER}">
                    <h3>${title}</h3>
                </div>
                <div class="${LoadExamples.TEMPLATES.CODE_CONTAINER}">
                    <div class="${LoadExamples.TEMPLATES.CODE_HEADER}">
                        <span>mermaid</span>
                        <button class="${LoadExamples.TEMPLATES.COPY_BTN}" 
                                aria-label="Copy code"
                                aria-describedby="${codeId}"
                                type="button">
                            <i class="fas fa-copy" aria-hidden="true"></i>
                        </button>
                    </div>
                    <pre class="${LoadExamples.TEMPLATES.CODE_BLOCK}" role="region" aria-label="Code example">
                        <code class="${LoadExamples.TEMPLATES.EXAMPLE_CODE}" id="${codeId}">${sanitizeInput(code)}</code>
                    </pre>
                </div>
                <button class="${LoadExamples.TEMPLATES.USE_BTN}" 
                        type="button"
                        aria-label="Use this example in the editor">
                    Use This Example
                </button>
            </div>
        `;
    }

    /**
     * Generates the complete HTML for all examples.
     * 
     * @private
     * @param {Array<Object>} snippets - Array of example snippets
     * @returns {string} Complete HTML string
     */
    _generateHTML(snippets) {
        const snippetsHTML = snippets
            .map((snippet, index) => this._generateSnippetHTML(snippet, index))
            .join('');

        return `
            <div role="region" aria-label="Mermaid diagram examples">
                <h2>Mermaid Diagram Examples</h2>
                <div class="${LoadExamples.TEMPLATES.CONTAINER}">
                    ${snippetsHTML}
                </div>
            </div>
        `;
    }

    /**
     * Clears any existing standalone examples to avoid duplication.
     * 
     * @private
     */
    _clearExistingExamples() {
        const standaloneExamples = document.getElementById('examples');
        if (standaloneExamples) {
            standaloneExamples.innerHTML = '';
            console.log('Cleared existing examples container');
        }
    }

    // ============================================================================
    // PUBLIC API METHODS
    // ============================================================================

    /**
     * Loads and returns HTML for Mermaid diagram examples.
     * Fetches examples file, parses content, and generates accessible HTML.
     * 
     * @public
     * @returns {Promise<string>} HTML string containing the examples
     * 
     * @example
     * const loader = new LoadExamples();
     * const html = await loader.loadExamples();
     * document.getElementById('container').innerHTML = html;
     */
    async loadExamples() {
        try {
            console.log('Starting to load examples...');
            
            // Fetch the examples file
            const content = await this._fetchExamplesFile();
            
            // Parse the content
            this.examples = this._parseExamples(content);
            
            // Generate HTML
            const html = this._generateHTML(this.examples);
            
            // Clear existing examples
            this._clearExistingExamples();
            
            // Mark as loaded
            this.isLoaded = true;
            
            console.log('Examples loaded successfully');
            return html;

        } catch (error) {
            console.error('Error loading examples:', error);
            
            // Return user-friendly error message
            return `
                <div class="examples-error" role="alert">
                    <h2>Examples Unavailable</h2>
                    <p>Unable to load diagram examples. Please check your connection and try again.</p>
                    <details>
                        <summary>Technical Details</summary>
                        <p>${sanitizeInput(error.message)}</p>
                    </details>
                </div>
            `;
        }
    }

    /**
     * Gets the loaded examples data.
     * 
     * @public
     * @returns {Array<Object>} Array of example objects
     */
    getExamples() {
        return [...this.examples]; // Return a copy to prevent external modification
    }

    /**
     * Checks if examples have been loaded.
     * 
     * @public
     * @returns {boolean} True if examples are loaded
     */
    isExamplesLoaded() {
        return this.isLoaded;
    }

    /**
     * Reloads examples from the source file.
     * 
     * @public
     * @returns {Promise<string>} Updated HTML string
     */
    async reloadExamples() {
        this.isLoaded = false;
        this.examples = [];
        return this.loadExamples();
    }

    /**
     * Updates the configuration.
     * 
     * @public
     * @param {Object} newConfig - New configuration options
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('LoadExamples configuration updated', this.config);
    }

    /**
     * Gets the current configuration.
     * 
     * @public
     * @returns {Object} Current configuration object
     */
    getConfig() {
        return { ...this.config }; // Return a copy to prevent external modification
    }

    /**
     * Cleans up event listeners and resources.
     * Should be called when the loader is no longer needed.
     * 
     * @public
     */
    destroy() {
        // Remove all tracked event listeners
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners.clear();
        
        // Reset state
        this.examples = [];
        this.isLoaded = false;
        
        console.log('LoadExamples destroyed and cleaned up');
    }
}

// Create a default instance for backward compatibility
const defaultLoader = new LoadExamples();

/**
 * Legacy function for backward compatibility.
 * 
 * @deprecated Use LoadExamples class instead. Will be removed in v2.0.
 * @returns {Promise<string>} HTML string containing the examples
 */
export async function loadExamples() {
    console.warn('loadExamples() function is deprecated. Use LoadExamples class instead.');
    return defaultLoader.loadExamples();
}

// Export the class as default
export default LoadExamples;
