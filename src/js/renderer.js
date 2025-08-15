import { sanitizeMermaidInput } from './utils/sanitizer.js';

/**
 * Renderer class manages the diagram rendering, zoom, pan, and display functionality.
 * Handles Mermaid diagram rendering, user interactions, and visual controls.
 * 
 * @class Renderer
 * @author Gargya Gokhale
 * @version 1.0.0
 */
export class Renderer {
    // Constants for configuration and magic numbers
    static MOBILE_BREAKPOINT = 768;
    static ZOOM_STEP = 0.1;
    static MIN_ZOOM = 0.2;
    static MAX_ZOOM = 5;
    static DEFAULT_ZOOM = 1;
    static SCROLL_INDICATOR_DURATION = 5000;
    static ANIMATION_DURATION = 1000;
    static TRANSITION_DURATION = '0.2s';

    /**
     * Creates an instance of Renderer.
     * Initializes Mermaid configuration, zoom/pan controls, and event listeners.
     * 
     * @constructor
     * @throws {Error} If required DOM elements are not found
     */
    constructor() {
        // Initialize DOM elements with validation
        this.outputDiv = this._getRequiredElement('mermaidOutput', 'output container');
        
        // Initialize zoom and pan state
        this.zoomLevel = Renderer.DEFAULT_ZOOM;
        this.panEnabled = false;
        this.translateX = 0;
        this.translateY = 0;
        this.isMobileView = window.innerWidth <= Renderer.MOBILE_BREAKPOINT;
        
        // Store event listener references for cleanup
        this.eventListeners = new Map();
        
        // Initialize Mermaid and setup functionality
        this._initializeMermaid();
        this._setupEventListeners();
        this._setupResizeHandler();
        
        console.log('Renderer initialized successfully');
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
     * Initializes Mermaid with secure configuration.
     * Sets up the Mermaid library with appropriate security and rendering settings.
     * 
     * @private
     */
    _initializeMermaid() {
        if (!window.mermaid) {
            throw new Error('Mermaid library is not loaded');
        }

        // Initialize Mermaid with safe configuration
        window.mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose', // Required for subgraph support
            logLevel: 'debug',
            flowchart: { 
                htmlLabels: true,
                subGraphTitleMargin: { top: 0, bottom: 0 }
            }
        });
        
        // Override Mermaid's default error handling
        window.mermaid.parseError = (err) => {
            console.error('Mermaid parse error:', err);
        };
    }

    /**
     * Sets up the window resize event listener with proper cleanup tracking.
     * 
     * @private
     */
    _setupResizeHandler() {
        const resizeHandler = () => {
            this.isMobileView = window.innerWidth <= Renderer.MOBILE_BREAKPOINT;
        };
        
        window.addEventListener('resize', resizeHandler);
        this.eventListeners.set('resize', resizeHandler);
    }

    /**
     * Sets up event listeners for diagram rendering.
     * Listens for 'diagram-update' custom events to trigger rendering.
     * 
     * @private
     */
    _setupEventListeners() {
        const diagramUpdateHandler = (event) => {
            this.renderDiagram(event.detail.content);
        };
        
        document.addEventListener('diagram-update', diagramUpdateHandler);
        this.eventListeners.set('diagram-update', diagramUpdateHandler);
    }

    /**
     * Sets up event listeners for diagram rendering.
     * Listens for 'diagram-update' custom events to trigger rendering.
     * @deprecated Use _setupEventListeners instead. Will be removed in v2.0.
     */
    setupEventListeners() {
        console.warn('setupEventListeners is deprecated. Event listeners are set up automatically in constructor.');
        // Method kept for backward compatibility
    }

    /**
     * Cleans up event listeners and resources.
     * Should be called when the renderer is no longer needed.
     * 
     * @public
     */
    destroy() {
        // Remove all tracked event listeners
        this.eventListeners.forEach((handler, eventType) => {
            if (eventType === 'resize') {
                window.removeEventListener(eventType, handler);
            } else {
                document.removeEventListener(eventType, handler);
            }
        });
        this.eventListeners.clear();
        
        // Clear output div
        if (this.outputDiv) {
            this.outputDiv.innerHTML = '';
        }
        
        console.log('Renderer destroyed and cleaned up');
    }

    /**
     * Renders a Mermaid diagram from the provided content.
     * Handles sanitization, rendering, error handling, and post-render setup.
     * 
     * @async
     * @param {string} content - The Mermaid diagram code to render
     * @returns {Promise<void>} Promise that resolves when rendering is complete
     * @throws {Error} If rendering fails due to invalid syntax or other issues
     * 
     * @example
     * // Render a simple flowchart
     * await renderer.renderDiagram('graph TD\n  A --> B');
     */
    async renderDiagram(content) {
        // Validate input
        if (!content || typeof content !== 'string') {
            this._showEmptyDiagramMessage();
            return;
        }

        const trimmedContent = content.trim();
        if (!trimmedContent) {
            this._showEmptyDiagramMessage();
            return;
        }

        try {
            // Clear previous content and errors
            this._clearPreviousContent();
            this._clearFooterErrors();
            
            // Generate unique ID and sanitize content
            const diagramId = this._generateDiagramId();
            const sanitizedContent = sanitizeMermaidInput(trimmedContent);
            
            console.log('Rendering diagram with ID:', diagramId);
            console.log('Sanitized content:', sanitizedContent);
            
            // Render the diagram
            const { svg } = await window.mermaid.render(diagramId, sanitizedContent);
            this.outputDiv.innerHTML = svg;
            
            // Post-render setup
            this._applyThemeToOutput();
            this._setupPostRenderControls();
            
            console.log('Diagram rendered successfully');
            
        } catch (error) {
            this._handleRenderError(error);
        }
    }

    /**
     * Shows empty diagram message in the output area.
     * 
     * @private
     */
    _showEmptyDiagramMessage() {
        this.outputDiv.innerHTML = '<p style="color: orange;">Enter diagram code and click render</p>';
    }

    /**
     * Clears previous diagram content from the output area.
     * 
     * @private
     */
    _clearPreviousContent() {
        this.outputDiv.innerHTML = '';
    }

    /**
     * Clears any syntax error messages from the footer.
     * 
     * @private
     */
    _clearFooterErrors() {
        const footer = document.querySelector('footer');
        if (footer && footer.innerHTML.includes('syntax error')) {
            footer.innerHTML = footer.innerHTML.replace(/syntax error.*/, '');
        }
    }

    /**
     * Generates a unique ID for the diagram.
     * 
     * @private
     * @returns {string} Unique diagram ID
     */
    _generateDiagramId() {
        return `mermaid-diagram-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Applies current theme to the rendered output.
     * 
     * @private
     */
    _applyThemeToOutput() {
        if (window.app && window.app.themeManager) {
            window.app.themeManager.applyThemeToOutput();
        }
    }

    /**
     * Sets up post-render controls and interactions.
     * 
     * @private
     */
    _setupPostRenderControls() {
        this._addZoomControlsToDOM();
        this._setupZoomAndPan();
        
        if (this.isMobileView) {
            this._addScrollIndicator();
        }
    }

    /**
     * Handles rendering errors with appropriate user feedback.
     * 
     * @private
     * @param {Error} error - The error that occurred during rendering
     */
    _handleRenderError(error) {
        console.error('Mermaid rendering error:', error);
        
        // Clean up any failed render artifacts
        this._cleanupFailedRender();
        
        // Show user-friendly error message
        const errorMessage = error.message || 'Please check your syntax and try again.';
        this.outputDiv.innerHTML = `<p style="color: red;">Error rendering diagram: ${errorMessage}</p>`;
    }

    /**
     * Cleans up any artifacts from failed rendering attempts.
     * 
     * @private
     */
    _cleanupFailedRender() {
        // Remove any Mermaid.js-generated div elements that may be left behind
        const errorDivs = document.querySelectorAll('div[id^="dmermaid-diagram"]');
        errorDivs.forEach((div) => div.remove());
    }

    /**
     * Creates and adds zoom control buttons to the DOM.
     * Builds a comprehensive control panel with zoom, pan, and theme controls.
     * 
     * @private
     */
    _addZoomControlsToDOM() {
        // Remove existing controls to prevent duplicates
        this._removeExistingControls();
        
        // Create and configure control container
        const controls = this._createControlContainer();
        
        // Add all control buttons
        const buttons = this._createControlButtons();
        buttons.forEach(button => controls.appendChild(button));
        
        // Add theme button if theme manager is available
        this._addThemeButton(controls);
        
        // Add controls to the output container
        this._attachControlsToOutput(controls);
    }

    /**
     * Removes existing zoom controls if they exist.
     * 
     * @private
     */
    _removeExistingControls() {
        const existingControls = document.getElementById('zoom-controls');
        if (existingControls) {
            existingControls.remove();
        }
    }

    /**
     * Creates the main control container element.
     * 
     * @private
     * @returns {HTMLElement} The control container element
     */
    _createControlContainer() {
        const controls = document.createElement('div');
        controls.id = 'zoom-controls';
        return controls;
    }

    /**
     * Creates all control buttons for zoom and pan functionality.
     * 
     * @private
     * @returns {HTMLElement[]} Array of button elements
     */
    _createControlButtons() {
        const buttonConfigs = [
            {
                id: 'zoom-in',
                icon: 'fas fa-search-plus',
                title: 'Zoom In',
                handler: () => this.zoomIn()
            },
            {
                id: 'zoom-out',
                icon: 'fas fa-search-minus',
                title: 'Zoom Out',
                handler: () => this.zoomOut()
            },
            {
                id: 'reset-zoom',
                icon: 'fas fa-redo-alt',
                title: 'Reset Zoom',
                handler: () => this.resetZoom()
            },
            {
                id: 'toggle-pan',
                icon: 'fas fa-hand-paper',
                title: 'Toggle Pan',
                handler: () => this.togglePan(),
                specialClass: this.panEnabled ? 'active' : ''
            }
        ];

        return buttonConfigs.map(config => this._createControlButton(config));
    }

    /**
     * Creates a single control button with the specified configuration.
     * 
     * @private
     * @param {Object} config - Button configuration object
     * @param {string} config.id - Button ID
     * @param {string} config.icon - FontAwesome icon class
     * @param {string} config.title - Button tooltip text
     * @param {Function} config.handler - Click event handler
     * @param {string} [config.specialClass] - Additional CSS class
     * @returns {HTMLElement} The created button element
     */
    _createControlButton(config) {
        const button = document.createElement('button');
        button.innerHTML = `<i class="${config.icon}"></i>`;
        button.title = config.title;
        button.className = 'zoom-control-btn';
        
        if (config.id === 'toggle-pan') {
            button.id = 'toggle-pan';
        }
        
        if (config.specialClass) {
            button.classList.add(config.specialClass);
        }
        
        button.addEventListener('click', config.handler);
        return button;
    }

    /**
     * Adds theme button to controls if theme manager is available.
     * 
     * @private
     * @param {HTMLElement} controls - The controls container
     */
    _addThemeButton(controls) {
        if (window.app && window.app.themeManager) {
            const themeBtn = window.app.themeManager.createThemeButton();
            controls.appendChild(themeBtn);
        }
    }

    /**
     * Attaches the control container to the output div.
     * 
     * @private
     * @param {HTMLElement} controls - The controls container
     */
    _attachControlsToOutput(controls) {
        this.outputDiv.style.position = 'relative';
        this.outputDiv.appendChild(controls);
    }

    /**
     * Sets up zoom and pan functionality for the rendered SVG.
     * Handles mouse and touch interactions for zooming and panning.
     * 
     * @private
     */
    _setupZoomAndPan() {
        const svgElement = this._getSvgElement();
        if (!svgElement) {
            console.warn('No SVG element found for zoom and pan setup');
            return;
        }
        
        this._configureSvgForInteraction(svgElement);
        this._setupMouseWheelZoom(svgElement);
        this._setupPanFunctionality(svgElement);
        this._setupTouchSupport(svgElement);
    }

    /**
     * Gets the SVG element from the output container.
     * 
     * @private
     * @returns {SVGElement|null} The SVG element or null if not found
     */
    _getSvgElement() {
        return this.outputDiv.querySelector('svg');
    }

    /**
     * Configures the SVG element for zoom and pan interactions.
     * 
     * @private
     * @param {SVGElement} svgElement - The SVG element to configure
     */
    _configureSvgForInteraction(svgElement) {
        svgElement.style.transition = Renderer.TRANSITION_DURATION;
        svgElement.style.transformOrigin = 'center';
        svgElement.style.cursor = this.panEnabled ? 'grab' : 'default';
        
        // Apply current transform
        this._applyTransform(svgElement);
    }

    /**
     * Sets up mouse wheel zoom functionality.
     * 
     * @private
     * @param {SVGElement} svgElement - The SVG element to add zoom to
     */
    _setupMouseWheelZoom(svgElement) {
        svgElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -Renderer.ZOOM_STEP : Renderer.ZOOM_STEP;
            this._zoom(delta);
        });
    }

    /**
     * Sets up pan functionality with mouse events.
     * 
     * @private
     * @param {SVGElement} svgElement - The SVG element to add panning to
     */
    _setupPanFunctionality(svgElement) {
        let isDragging = false;
        let startX, startY;
        
        const handleMouseDown = (e) => {
            if (!this.panEnabled) return;
            
            isDragging = true;
            startX = e.clientX - this.translateX;
            startY = e.clientY - this.translateY;
            svgElement.style.cursor = 'grabbing';
            e.preventDefault();
        };
        
        const handleMouseMove = (e) => {
            if (!isDragging || !this.panEnabled) return;
            
            this.translateX = e.clientX - startX;
            this.translateY = e.clientY - startY;
            this._applyTransform(svgElement);
        };
        
        const handleMouseUp = () => {
            if (!isDragging) return;
            
            isDragging = false;
            if (this.panEnabled) {
                svgElement.style.cursor = 'grab';
            }
        };
        
        svgElement.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    /**
     * Sets up touch support for mobile devices.
     * 
     * @private
     * @param {SVGElement} svgElement - The SVG element to add touch support to
     */
    _setupTouchSupport(svgElement) {
        let isDragging = false;
        let startX, startY;
        
        const handleTouchStart = (e) => {
            if (!this.panEnabled || e.touches.length !== 1) return;
            
            isDragging = true;
            startX = e.touches[0].clientX - this.translateX;
            startY = e.touches[0].clientY - this.translateY;
            e.preventDefault();
        };
        
        const handleTouchMove = (e) => {
            if (!isDragging || !this.panEnabled || e.touches.length !== 1) return;
            
            this.translateX = e.touches[0].clientX - startX;
            this.translateY = e.touches[0].clientY - startY;
            this._applyTransform(svgElement);
            e.preventDefault();
        };
        
        const handleTouchEnd = () => {
            isDragging = false;
        };
        
        svgElement.addEventListener('touchstart', handleTouchStart);
        svgElement.addEventListener('touchmove', handleTouchMove);
        svgElement.addEventListener('touchend', handleTouchEnd);
    }

    /**
     * Applies transform to an element with current zoom and translation values.
     * 
     * @private
     * @param {Element} element - The element to apply transform to
     */
    _applyTransform(element) {
        element.style.transform = `scale(${this.zoomLevel}) translate(${this.translateX}px, ${this.translateY}px)`;
    }

    /**
     * Performs zoom operation with specified delta.
     * 
     * @private
     * @param {number} delta - The zoom delta (positive for zoom in, negative for zoom out)
     */
    _zoom(delta) {
        // Limit zoom between MIN_ZOOM and MAX_ZOOM
        const newZoom = Math.max(
            Renderer.MIN_ZOOM, 
            Math.min(Renderer.MAX_ZOOM, this.zoomLevel + delta)
        );
        this.zoomLevel = newZoom;
        
        const svgElement = this._getSvgElement();
        if (svgElement) {
            this._applyTransform(svgElement);
        }
    }

    // ============================================================================
    // PUBLIC API METHODS - For external access and backward compatibility
    // ============================================================================

    /**
     * Zooms in by the default zoom step.
     * 
     * @public
     */
    zoomIn() {
        this._zoom(Renderer.ZOOM_STEP);
    }

    /**
     * Zooms out by the default zoom step.
     * 
     * @public
     */
    zoomOut() {
        this._zoom(-Renderer.ZOOM_STEP);
    }

    /**
     * Resets zoom and pan to default values.
     * 
     * @public
     */
    resetZoom() {
        this.zoomLevel = Renderer.DEFAULT_ZOOM;
        this.translateX = 0;
        this.translateY = 0;
        
        const svgElement = this._getSvgElement();
        if (svgElement) {
            this._applyTransform(svgElement);
        }
    }

    /**
     * Toggles pan mode on and off.
     * 
     * @public
     */
    togglePan() {
        this.panEnabled = !this.panEnabled;
        
        const panBtn = document.getElementById('toggle-pan');
        if (panBtn) {
            panBtn.classList.toggle('active', this.panEnabled);
        }
        
        const svgElement = this._getSvgElement();
        if (svgElement) {
            svgElement.style.cursor = this.panEnabled ? 'grab' : 'default';
        }
    }

    /**
     * Adds a scroll indicator for mobile view.
     * Shows a temporary indicator to inform users about scroll capability.
     * 
     * @private
     */
    _addScrollIndicator() {
        // Remove any existing indicator
        const existingIndicator = document.querySelector('.scroll-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // Create scroll indicator
        const indicator = document.createElement('div');
        indicator.className = 'scroll-indicator';
        indicator.innerHTML = '<i class="fas fa-arrows-alt-v"></i>';
        
        // Append to output container
        this.outputDiv.appendChild(indicator);
        
        // Fade out after configured duration
        setTimeout(() => {
            indicator.classList.add('fade');
            // Remove from DOM after animation completes
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
            }, Renderer.ANIMATION_DURATION);
        }, Renderer.SCROLL_INDICATOR_DURATION);
    }

    /**
     * Re-renders the current diagram (useful for theme changes).
     * Gets the current content from the input and renders it again.
     * 
     * @public
     */
    reRender() {
        const currentContent = document.getElementById('mermaidInput')?.value;
        if (currentContent && currentContent.trim()) {
            this.renderDiagram(currentContent);
        }
    }

    // ============================================================================
    // DEPRECATED METHODS - Kept for backward compatibility, will be removed in v2.0
    // ============================================================================

    /**
     * @deprecated Use _addZoomControlsToDOM instead. Will be removed in v2.0.
     */
    addZoomControlsToDOM() {
        console.warn('addZoomControlsToDOM is deprecated. Use _addZoomControlsToDOM instead.');
        this._addZoomControlsToDOM();
    }

    /**
     * @deprecated Use _setupZoomAndPan instead. Will be removed in v2.0.
     */
    setupZoomAndPan() {
        console.warn('setupZoomAndPan is deprecated. Use _setupZoomAndPan instead.');
        this._setupZoomAndPan();
    }

    /**
     * @deprecated Use _applyTransform instead. Will be removed in v2.0.
     */
    applyTransform(element) {
        console.warn('applyTransform is deprecated. Use _applyTransform instead.');
        this._applyTransform(element);
    }

    /**
     * @deprecated Use _zoom instead. Will be removed in v2.0.
     */
    zoom(delta) {
        console.warn('zoom is deprecated. Use _zoom instead.');
        this._zoom(delta);
    }

    /**
     * @deprecated Use _addScrollIndicator instead. Will be removed in v2.0.
     */
    addScrollIndicator() {
        console.warn('addScrollIndicator is deprecated. Use _addScrollIndicator instead.');
        this._addScrollIndicator();
    }
}
