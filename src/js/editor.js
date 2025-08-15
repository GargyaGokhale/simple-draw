import { loadExamples } from './loadExamples.js';

/**
 * Editor class manages the diagram input interface and related functionality.
 * Handles user input, rendering triggers, examples popup, and copy operations.
 * 
 * @class Editor
 * @author Gargya Gokhale
 * @version 1.0.0
 */
export class Editor {
    /**
     * Creates an instance of Editor.
     * Initializes DOM elements, sets up event listeners, and configures the editor interface.
     * 
     * @constructor
     * @throws {Error} If required DOM elements are not found
     */
    constructor() {
        console.log('Initializing Editor...');
        
        // Initialize DOM elements with validation
        this.textarea = this._getRequiredElement('mermaidInput', 'textarea');
        this.renderBtn = this._getRequiredElement('renderBtn', 'render button');
        this.infoBtn = this._getRequiredElement('infoBtn', 'info button');
        
        // Create and configure popup
        this.infoPopup = this._createInfoPopup();
        console.log('Info popup created successfully.');
        
        // Setup all event listeners and functionality
        this._setupEventListeners();
        this._setupCopyButton();
        this._cleanupRedundantElements();
        
        console.log('Editor initialized successfully.');
    }

    /**
     * Gets a required DOM element and throws an error if not found.
     * 
     * @private
     * @param {string} id - The element ID to search for
     * @param {string} description - Human-readable description for error messages
     * @returns {HTMLElement} The found DOM element
     * @throws {Error} If the element is not found
     */
    _getRequiredElement(id, description) {
        const element = document.getElementById(id);
        if (!element) {
            throw new Error(`Required ${description} element with ID '${id}' not found`);
        }
        return element;
    }

    /**
     * Removes redundant DOM elements and cleans up attributes to prevent conflicts.
     * 
     * @private
     */
    _cleanupRedundantElements() {
        // Remove the redundant examples container if it exists
        const redundantExamples = document.getElementById('examples');
        if (redundantExamples) {
            redundantExamples.remove();
            console.log('Removed redundant examples container');
        }

        // Remove infoBtn onclick attribute to prevent double loading
        if (this.infoBtn) {
            this.infoBtn.removeAttribute('onclick');
        }
    }

    /**
     * Sets up all event listeners for the editor functionality.
     * Includes render button, info button, and popup close functionality.
     * 
     * @private
     */
    _setupEventListeners() {
        this._setupRenderButton();
        this._setupInfoButton();
        this._setupPopupClose();
    }

    /**
     * Sets up the render button event listener.
     * Handles diagram rendering with proper error handling.
     * 
     * @private
     */
    _setupRenderButton() {
        if (!this.renderBtn) return;
        
        this.renderBtn.addEventListener('click', () => {
            try {
                console.log('Render button clicked');
                const content = this._getDiagramContent();
                
                if (!content) {
                    console.warn('No diagram content provided');
                    return;
                }
                
                const event = new CustomEvent('diagram-update', {
                    detail: { content }
                });
                document.dispatchEvent(event);
            } catch (error) {
                console.error('Error processing diagram content:', error);
                this._showError('An error occurred while processing your input.');
            }
        });
    }

    /**
     * Sets up the info button event listener.
     * Handles opening the examples popup and loading content.
     * 
     * @private
     */
    _setupInfoButton() {
        if (!this.infoBtn) return;
        
        this.infoBtn.addEventListener('click', async () => {
            try {
                this.infoPopup.classList.add('active');
                const html = await loadExamples();
                const contentArea = this.infoPopup.querySelector('.info-content');
                
                if (contentArea) {
                    contentArea.innerHTML = html;
                    this._setupSnippetCopyButtons();
                }
            } catch (error) {
                console.error('Error loading examples:', error);
                this._showError('Failed to load examples. Please try again.');
            }
        });
    }

    /**
     * Sets up the popup close button event listener.
     * 
     * @private
     */
    _setupPopupClose() {
        if (!this.infoPopup) return;
        
        const closeBtn = this.infoPopup.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.infoPopup.classList.remove('active');
            });
        }
    }

    /**
     * Sets up the copy button functionality for example code.
     * Handles copying text to clipboard with error handling.
     * 
     * @private
     */
    _setupCopyButton() {
        const copyBtn = document.getElementById('copyExample');
        const exampleCode = document.getElementById('exampleCode');
        
        if (copyBtn && exampleCode) {
            copyBtn.addEventListener('click', async () => {
                try {
                    await this._copyToClipboard(exampleCode.textContent.trim());
                    this._showSuccess('Example code copied to clipboard!');
                } catch (error) {
                    console.error('Failed to copy text:', error);
                    this._showError('Failed to copy text. Please try again.');
                }
            });
        }
    }
    
    /**
     * Sets up copy buttons for code snippets in the examples popup.
     * Handles copying individual example snippets to clipboard.
     * 
     * @private
     */
    _setupSnippetCopyButtons() {
        const copyButtons = this.infoPopup.querySelectorAll('.copy-btn');
        
        copyButtons.forEach(button => {
            button.addEventListener('click', async () => {
                try {
                    const codeElement = button.previousElementSibling.querySelector('code');
                    if (codeElement) {
                        await this._copyToClipboard(codeElement.textContent.trim());
                        this._showSuccess('Example code copied to clipboard!');
                    }
                } catch (error) {
                    console.error('Failed to copy text:', error);
                    this._showError('Failed to copy text. Please try again.');
                }
            });
        });
    }

    /**
     * Creates and configures the info popup for displaying examples.
     * 
     * @private
     * @returns {HTMLElement} The created popup element
     */
    _createInfoPopup() {
        const popup = document.createElement('div');
        popup.className = 'info-popup';
        
        // Create basic structure without loading examples yet
        popup.innerHTML = `
            <button class="close-btn button"><i class="fas fa-times"></i></button>
            <div class="info-content">
                <p>Loading examples...</p>
            </div>
        `;
        
        document.body.appendChild(popup);
        return popup;
    }

    /**
     * Gets the current diagram content from the textarea.
     * 
     * @private
     * @returns {string} The trimmed diagram content
     */
    _getDiagramContent() {
        return this.textarea.value.trim();
    }

    /**
     * Gets the current diagram content from the textarea.
     * Public method for external access.
     * 
     * @returns {string} The trimmed diagram content
     */
    getDiagramContent() {
        return this.textarea.value.trim();
    }

    /**
     * Sets the content of the diagram textarea.
     * 
     * @param {string} content - The content to set in the textarea
     * @throws {Error} If content is not a string
     */
    setContent(content) {
        if (typeof content !== 'string') {
            throw new Error('Content must be a string');
        }
        this.textarea.value = content;
    }

    /**
     * Copies text to clipboard using the modern Clipboard API.
     * 
     * @private
     * @param {string} text - The text to copy to clipboard
     * @returns {Promise<void>} Promise that resolves when text is copied
     * @throws {Error} If clipboard operation fails
     */
    async _copyToClipboard(text) {
        if (!navigator.clipboard) {
            throw new Error('Clipboard API not supported');
        }
        return await navigator.clipboard.writeText(text);
    }

    /**
     * Shows a success message to the user.
     * 
     * @private
     * @param {string} message - The success message to display
     */
    _showSuccess(message) {
        // For now using alert, could be replaced with a toast notification
        alert(message);
    }

    /**
     * Shows an error message to the user.
     * 
     * @private
     * @param {string} message - The error message to display
     */
    _showError(message) {
        // For now using alert, could be replaced with a toast notification
        alert(message);
    }

    // ============================================================================
    // DEPRECATED METHODS - Kept for backward compatibility, will be removed in v2.0
    // ============================================================================

    /**
     * @deprecated Use _setupEventListeners instead. Will be removed in v2.0.
     */
    setupEventListeners() {
        console.warn('setupEventListeners is deprecated. Use _setupEventListeners instead.');
        this._setupEventListeners();
    }

    /**
     * @deprecated Use _setupCopyButton instead. Will be removed in v2.0.
     */
    setupCopyButton() {
        console.warn('setupCopyButton is deprecated. Use _setupCopyButton instead.');
        this._setupCopyButton();
    }

    /**
     * @deprecated Use _setupSnippetCopyButtons instead. Will be removed in v2.0.
     */
    setupSnippetCopyButtons() {
        console.warn('setupSnippetCopyButtons is deprecated. Use _setupSnippetCopyButtons instead.');
        this._setupSnippetCopyButtons();
    }

    /**
     * @deprecated Use _createInfoPopup instead. Will be removed in v2.0.
     */
    createInfoPopup() {
        console.warn('createInfoPopup is deprecated. Use _createInfoPopup instead.');
        return this._createInfoPopup();
    }

    /**
     * @deprecated This method is no longer needed as sanitization is handled in renderer. Will be removed in v2.0.
     */
    sanitizeInput(input) {
        console.warn('sanitizeInput is deprecated and no longer needed. Sanitization is handled in renderer.');
        return input.replace(/[<>&"]/g, (char) => {
            switch (char) {
                case '<': return '&lt;';
                case '&': return '&amp;';
                case '"': return '&quot;';
                default: return char;
            }
        });
    }
}
