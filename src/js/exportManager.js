/**
 * ExportManager class handles diagram export functionality for multiple formats.
 * Provides SVG and PNG export capabilities with comprehensive error handling,
 * file sanitization, and customizable export options.
 * 
 * @class ExportManager
 * @author Gargya Gokhale
 * @version 1.0.0
 */
export class ExportManager {
    // Export configuration constants
    static EXPORT_CONFIG = {
        SVG_MIME_TYPE: 'image/svg+xml',
        PNG_MIME_TYPE: 'image/png',
        DEFAULT_SVG_FILENAME: 'diagram.svg',
        DEFAULT_PNG_FILENAME: 'diagram.png',
        PNG_QUALITY: 0.95,
        MAX_EXPORT_SIZE: 10 * 1024 * 1024, // 10MB limit
        SUPPORTED_FORMATS: ['svg', 'png']
    };

    // HTML element selectors
    static SELECTORS = {
        SVG_BUTTON: '#exportSVG',
        PNG_BUTTON: '#exportPNG',
        DIAGRAM_OUTPUT: '#mermaidOutput svg'
    };

    // Error messages
    static ERROR_MESSAGES = {
        NO_DIAGRAM: 'No diagram to export! Please render a diagram first.',
        INVALID_SVG: 'Invalid SVG content. Export aborted.',
        PNG_CREATION_FAILED: 'Failed to create PNG file. Please try again.',
        EXPORT_ERROR_SVG: 'Error exporting SVG. Please try again.',
        EXPORT_ERROR_PNG: 'Error exporting PNG. Please try again.',
        HTML2CANVAS_NOT_LOADED: 'html2canvas library is not loaded. PNG export unavailable.',
        BUTTON_NOT_FOUND: 'Export button not found',
        FILE_TOO_LARGE: 'Export file is too large (max 10MB)'
    };

    /**
     * Creates an instance of ExportManager.
     * 
     * @constructor
     * @param {Object} [options={}] - Configuration options for the export manager
     * @param {string} [options.defaultSvgFilename] - Default filename for SVG exports
     * @param {string} [options.defaultPngFilename] - Default filename for PNG exports
     * @param {number} [options.pngQuality] - PNG quality (0-1)
     * @param {boolean} [options.addTimestamp] - Whether to add timestamp to filenames
     * @throws {Error} If required DOM elements are not found
     */
    constructor(options = {}) {
        // Configuration with defaults
        this.config = {
            defaultSvgFilename: options.defaultSvgFilename || ExportManager.EXPORT_CONFIG.DEFAULT_SVG_FILENAME,
            defaultPngFilename: options.defaultPngFilename || ExportManager.EXPORT_CONFIG.DEFAULT_PNG_FILENAME,
            pngQuality: options.pngQuality || ExportManager.EXPORT_CONFIG.PNG_QUALITY,
            addTimestamp: options.addTimestamp || false,
            maxFileSize: options.maxFileSize || ExportManager.EXPORT_CONFIG.MAX_EXPORT_SIZE
        };

        // Validate dependencies and DOM elements
        this._validateDependencies();
        this._initializeElements();
        
        // Store event listener references for cleanup
        this.eventListeners = new Map();
        
        // Setup event handlers
        this._setupEventListeners();
        
        console.log('ExportManager initialized successfully');
    }

    /**
     * Validates that required dependencies are available.
     * 
     * @private
     * @throws {Error} If html2canvas is not loaded
     */
    _validateDependencies() {
        // Check if html2canvas is available for PNG export
        if (!window.html2canvas) {
            console.warn(ExportManager.ERROR_MESSAGES.HTML2CANVAS_NOT_LOADED);
            this.pngExportAvailable = false;
        } else {
            this.pngExportAvailable = true;
        }
    }

    /**
     * Initializes DOM element references with validation.
     * 
     * @private
     * @throws {Error} If required buttons are not found
     */
    _initializeElements() {
        this.svgBtn = document.querySelector(ExportManager.SELECTORS.SVG_BUTTON);
        this.pngBtn = document.querySelector(ExportManager.SELECTORS.PNG_BUTTON);

        if (!this.svgBtn) {
            throw new Error(`${ExportManager.ERROR_MESSAGES.BUTTON_NOT_FOUND}: SVG export button`);
        }
        
        if (!this.pngBtn) {
            throw new Error(`${ExportManager.ERROR_MESSAGES.BUTTON_NOT_FOUND}: PNG export button`);
        }

        // Disable PNG button if html2canvas is not available
        if (!this.pngExportAvailable) {
            this.pngBtn.disabled = true;
            this.pngBtn.title = 'PNG export unavailable - html2canvas not loaded';
        }
    }

    /**
     * Sets up event listeners for export buttons.
     * 
     * @private
     */
    _setupEventListeners() {
        const svgHandler = () => this.exportSVG();
        const pngHandler = () => this.exportPNG();

        this.svgBtn.addEventListener('click', svgHandler);
        this.pngBtn.addEventListener('click', pngHandler);

        // Store references for cleanup
        this.eventListeners.set('svg-export', { element: this.svgBtn, handler: svgHandler });
        this.eventListeners.set('png-export', { element: this.pngBtn, handler: pngHandler });
    }

    /**
     * Cleans up event listeners and resources.
     * Should be called when the export manager is no longer needed.
     * 
     * @public
     */
    destroy() {
        // Remove all tracked event listeners
        this.eventListeners.forEach(({ element, handler }) => {
            element.removeEventListener('click', handler);
        });
        this.eventListeners.clear();
        
        console.log('ExportManager destroyed and cleaned up');
    }

    /**
     * Gets the current diagram SVG element from the DOM.
     * 
     * @private
     * @returns {SVGElement|null} The SVG element or null if not found
     */
    _getDiagramSvg() {
        return document.querySelector(ExportManager.SELECTORS.DIAGRAM_OUTPUT);
    }

    /**
     * Validates that a diagram is available for export.
     * 
     * @private
     * @returns {SVGElement} The validated SVG element
     * @throws {Error} If no diagram is available
     */
    _validateDiagramAvailable() {
        const svg = this._getDiagramSvg();
        if (!svg) {
            throw new Error(ExportManager.ERROR_MESSAGES.NO_DIAGRAM);
        }
        return svg;
    }

    /**
     * Generates a filename with optional timestamp.
     * 
     * @private
     * @param {string} baseFilename - The base filename
     * @returns {string} The generated filename
     */
    _generateFilename(baseFilename) {
        if (!this.config.addTimestamp) {
            return baseFilename;
        }

        const timestamp = new Date().toISOString()
            .replace(/[:.]/g, '-')
            .replace('T', '_')
            .slice(0, -5); // Remove milliseconds and Z

        const dotIndex = baseFilename.lastIndexOf('.');
        if (dotIndex === -1) {
            return `${baseFilename}_${timestamp}`;
        }

        return `${baseFilename.slice(0, dotIndex)}_${timestamp}${baseFilename.slice(dotIndex)}`;
    }

    /**
     * Sanitizes SVG content to remove potentially harmful elements.
     * Uses secure parsing and validation to ensure safe SVG export.
     * 
     * @private
     * @param {string} svgContent - The SVG content to sanitize
     * @returns {string} The sanitized SVG content
     * @throws {Error} If SVG content is invalid or sanitization fails
     */
    _sanitizeSvgContent(svgContent) {
        if (!svgContent || typeof svgContent !== 'string') {
            throw new Error('Invalid SVG content provided');
        }

        try {
            // Parse SVG with secure DOM parser
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgContent, 'image/svg+xml');

            // Check for parsing errors
            const parserError = doc.querySelector('parsererror');
            if (parserError) {
                throw new Error('SVG parsing failed: ' + parserError.textContent);
            }

            // Remove potentially harmful elements
            const forbiddenElements = ['script', 'object', 'embed', 'iframe', 'form', 'input'];
            forbiddenElements.forEach(tagName => {
                const elements = doc.querySelectorAll(tagName);
                elements.forEach(element => element.remove());
            });

            // Remove dangerous attributes
            const allElements = doc.querySelectorAll('*');
            allElements.forEach(element => {
                // Remove event handlers and javascript: URLs
                Array.from(element.attributes).forEach(attr => {
                    if (attr.name.startsWith('on') || 
                        (attr.value && attr.value.toLowerCase().includes('javascript:'))) {
                        element.removeAttribute(attr.name);
                    }
                });
            });

            // Serialize back to string
            const sanitizedContent = new XMLSerializer().serializeToString(doc);
            
            // Validate size
            if (sanitizedContent.length > this.config.maxFileSize) {
                throw new Error(ExportManager.ERROR_MESSAGES.FILE_TOO_LARGE);
            }

            return sanitizedContent;

        } catch (error) {
            throw new Error(`SVG sanitization failed: ${error.message}`);
        }
    }

    /**
     * Creates a download link and triggers file download.
     * 
     * @private
     * @param {Blob} blob - The file blob to download
     * @param {string} fileName - The name for the downloaded file
     * @throws {Error} If download fails
     */
    _downloadFile(blob, fileName) {
        if (!blob || !(blob instanceof Blob)) {
            throw new Error('Invalid blob provided for download');
        }

        if (!fileName || typeof fileName !== 'string') {
            throw new Error('Invalid filename provided for download');
        }

        let url = null;
        try {
            url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.style.display = 'none';

            // Append to body, click, and remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log(`Successfully downloaded: ${fileName}`);

        } catch (error) {
            throw new Error(`Download failed: ${error.message}`);
        } finally {
            // Always clean up the object URL
            if (url) {
                URL.revokeObjectURL(url);
            }
        }
    }

    /**
     * Shows user-friendly error message.
     * 
     * @private
     * @param {string} message - The error message to display
     * @param {Error} [error] - The original error for logging
     */
    _showError(message, error = null) {
        if (error) {
            console.error('Export error:', error);
        }
        alert(message);
    }

    // ============================================================================
    // PUBLIC EXPORT METHODS
    // ============================================================================

    /**
     * Exports the current diagram as an SVG file.
     * Validates diagram availability, sanitizes content, and triggers download.
     * 
     * @public
     * @param {string} [filename] - Custom filename for the export
     * @returns {Promise<boolean>} True if export was successful, false otherwise
     * 
     * @example
     * // Export with default filename
     * await exportManager.exportSVG();
     * 
     * @example
     * // Export with custom filename
     * await exportManager.exportSVG('my-diagram.svg');
     */
    async exportSVG(filename = null) {
        try {
            // Validate diagram availability
            const svg = this._validateDiagramAvailable();

            // Serialize SVG content
            const rawSvgContent = new XMLSerializer().serializeToString(svg);
            
            // Sanitize SVG content
            const sanitizedSvgContent = this._sanitizeSvgContent(rawSvgContent);
            
            if (!sanitizedSvgContent) {
                throw new Error(ExportManager.ERROR_MESSAGES.INVALID_SVG);
            }

            // Generate filename
            const exportFilename = filename || this._generateFilename(this.config.defaultSvgFilename);

            // Create blob and download
            const blob = new Blob([sanitizedSvgContent], { 
                type: ExportManager.EXPORT_CONFIG.SVG_MIME_TYPE 
            });
            
            this._downloadFile(blob, exportFilename);
            
            console.log(`SVG export completed: ${exportFilename}`);
            return true;

        } catch (error) {
            this._showError(ExportManager.ERROR_MESSAGES.EXPORT_ERROR_SVG, error);
            return false;
        }
    }

    /**
     * Exports the current diagram as a PNG file using html2canvas.
     * Requires html2canvas library to be loaded.
     * 
     * @public
     * @param {string} [filename] - Custom filename for the export
     * @param {Object} [options={}] - Export options
     * @param {number} [options.quality] - PNG quality (0-1)
     * @param {number} [options.scale] - Scale factor for higher resolution
     * @param {string} [options.backgroundColor] - Background color for PNG
     * @returns {Promise<boolean>} True if export was successful, false otherwise
     * 
     * @example
     * // Export with default settings
     * await exportManager.exportPNG();
     * 
     * @example
     * // Export with custom options
     * await exportManager.exportPNG('diagram.png', {
     *   quality: 0.9,
     *   scale: 2,
     *   backgroundColor: '#ffffff'
     * });
     */
    async exportPNG(filename = null, options = {}) {
        try {
            // Check if PNG export is available
            if (!this.pngExportAvailable) {
                throw new Error(ExportManager.ERROR_MESSAGES.HTML2CANVAS_NOT_LOADED);
            }

            // Validate diagram availability
            const svg = this._validateDiagramAvailable();

            // Configure html2canvas options
            const html2canvasOptions = {
                scale: options.scale || 1,
                backgroundColor: options.backgroundColor || null,
                useCORS: true,
                allowTaint: true,
                logging: false
            };

            // Generate filename
            const exportFilename = filename || this._generateFilename(this.config.defaultPngFilename);

            // Use html2canvas to convert SVG to canvas
            const canvas = await window.html2canvas(svg, html2canvasOptions);
            
            // Convert canvas to blob
            const blob = await new Promise((resolve, reject) => {
                const quality = options.quality || this.config.pngQuality;
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to create PNG blob'));
                        }
                    },
                    ExportManager.EXPORT_CONFIG.PNG_MIME_TYPE,
                    quality
                );
            });

            // Validate file size
            if (blob.size > this.config.maxFileSize) {
                throw new Error(ExportManager.ERROR_MESSAGES.FILE_TOO_LARGE);
            }

            // Download the file
            this._downloadFile(blob, exportFilename);
            
            console.log(`PNG export completed: ${exportFilename}`);
            return true;

        } catch (error) {
            this._showError(ExportManager.ERROR_MESSAGES.EXPORT_ERROR_PNG, error);
            return false;
        }
    }

    // ============================================================================
    // UTILITY AND CONFIGURATION METHODS
    // ============================================================================

    /**
     * Updates the export configuration.
     * 
     * @public
     * @param {Object} newConfig - New configuration options
     * @param {string} [newConfig.defaultSvgFilename] - Default SVG filename
     * @param {string} [newConfig.defaultPngFilename] - Default PNG filename
     * @param {number} [newConfig.pngQuality] - PNG quality (0-1)
     * @param {boolean} [newConfig.addTimestamp] - Whether to add timestamp
     * @param {number} [newConfig.maxFileSize] - Maximum file size in bytes
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('ExportManager configuration updated', this.config);
    }

    /**
     * Gets the current export configuration.
     * 
     * @public
     * @returns {Object} Current configuration object
     */
    getConfig() {
        return { ...this.config }; // Return a copy to prevent external modification
    }

    /**
     * Checks if a diagram is currently available for export.
     * 
     * @public
     * @returns {boolean} True if a diagram is available
     */
    isDiagramAvailable() {
        return this._getDiagramSvg() !== null;
    }

    /**
     * Checks if PNG export is available (html2canvas loaded).
     * 
     * @public
     * @returns {boolean} True if PNG export is available
     */
    isPngExportAvailable() {
        return this.pngExportAvailable;
    }

    /**
     * Gets information about supported export formats.
     * 
     * @public
     * @returns {Array<Object>} Array of supported format information
     */
    getSupportedFormats() {
        return [
            {
                format: 'svg',
                name: 'Scalable Vector Graphics',
                mimeType: ExportManager.EXPORT_CONFIG.SVG_MIME_TYPE,
                available: true,
                description: 'Vector format, scalable, small file size'
            },
            {
                format: 'png',
                name: 'Portable Network Graphics',
                mimeType: ExportManager.EXPORT_CONFIG.PNG_MIME_TYPE,
                available: this.pngExportAvailable,
                description: 'Raster format, good quality, larger file size'
            }
        ];
    }

    // ============================================================================
    // DEPRECATED METHODS - Kept for backward compatibility, will be removed in v2.0
    // ============================================================================

    /**
     * @deprecated Use _setupEventListeners instead. Will be removed in v2.0.
     */
    setupEventListeners() {
        console.warn('setupEventListeners() is deprecated. Event listeners are set up automatically.');
        this._setupEventListeners();
    }

    /**
     * @deprecated Use _downloadFile instead. Will be removed in v2.0.
     */
    downloadFile(blob, fileName) {
        console.warn('downloadFile() is deprecated. Use _downloadFile instead.');
        return this._downloadFile(blob, fileName);
    }

    /**
     * @deprecated Use _sanitizeSvgContent instead. Will be removed in v2.0.
     */
    sanitizeSVG(svgContent) {
        console.warn('sanitizeSVG() is deprecated. Use _sanitizeSvgContent instead.');
        return this._sanitizeSvgContent(svgContent);
    }
}
