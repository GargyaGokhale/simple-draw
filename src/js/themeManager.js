/**
 * ThemeManager class handles theme switching and styling for the application.
 * Manages Mermaid theme configuration, UI theme controls, and persistent theme storage.
 * 
 * @class ThemeManager
 * @author Gargya Gokhale
 * @version 1.0.0
 */
export class ThemeManager {
    // Theme configuration constants
    static THEME_STORAGE_KEY = 'mermaid-theme';
    static DEFAULT_THEME_KEY = 'default';
    
    // Mermaid base configuration (shared across all themes)
    static MERMAID_BASE_CONFIG = {
        startOnLoad: false,
        securityLevel: 'loose',
        logLevel: 'debug',
        flowchart: { 
            htmlLabels: true,
            subGraphTitleMargin: { top: 0, bottom: 0 }
        }
    };

    /**
     * Creates an instance of ThemeManager.
     * 
     * @constructor
     * @param {Object} renderer - The renderer instance for re-rendering diagrams
     * @throws {Error} If renderer is not provided or invalid
     */
    constructor(renderer) {
        // Validate required dependencies
        this._validateRenderer(renderer);
        this._validateMermaidAvailability();
        
        this.renderer = renderer;
        this.currentTheme = ThemeManager.DEFAULT_THEME_KEY;
        
        // Store event listener references for cleanup
        this.eventListeners = new Map();
        
        // Define available themes
        this.themes = this._initializeThemeDefinitions();
        
        // Initialize the theme manager
        this._initialize();
        
        console.log('ThemeManager initialized successfully');
    }

    /**
     * Validates that the renderer is provided and has required methods.
     * 
     * @private
     * @param {Object} renderer - The renderer instance to validate
     * @throws {Error} If renderer is invalid
     */
    _validateRenderer(renderer) {
        if (!renderer) {
            throw new Error('Renderer is required for ThemeManager');
        }
        if (typeof renderer.reRender !== 'function') {
            throw new Error('Renderer must have a reRender method');
        }
    }

    /**
     * Validates that Mermaid library is available.
     * 
     * @private
     * @throws {Error} If Mermaid is not loaded
     */
    _validateMermaidAvailability() {
        if (!window.mermaid) {
            throw new Error('Mermaid library is not loaded');
        }
    }

    /**
     * Initializes theme definitions with comprehensive configuration.
     * 
     * @private
     * @returns {Object} Theme definitions object
     */
    _initializeThemeDefinitions() {
        return {
            default: {
                name: 'Default',
                mermaidTheme: 'default',
                cssClass: 'theme-default',
                gradient: 'linear-gradient(45deg, #6c63ff 50%, #a855f7 50%)',
                variables: this._getDefaultThemeVariables()
            },
            dark: {
                name: 'Black & White',
                mermaidTheme: 'base',
                cssClass: 'theme-dark',
                gradient: 'linear-gradient(45deg, #000000 50%, #ffffff 50%)',
                variables: this._getDarkThemeVariables()
            },
            custom: {
                name: 'Blue Orange',
                mermaidTheme: 'base',
                cssClass: 'theme-custom',
                gradient: 'linear-gradient(45deg, #2563eb 50%, #f97316 50%)',
                variables: this._getCustomThemeVariables()
            }
        };
    }

    /**
     * Gets default theme variables configuration.
     * 
     * @private
     * @returns {Object} Default theme variables
     */
    _getDefaultThemeVariables() {
        return {
            background: '#ffffff',
            mainBkg: '#ffffff',
            secondBkg: '#ffffff',
            textColor: '#000000',
            labelTextColor: '#000000'
        };
    }

    /**
     * Gets dark theme variables configuration.
     * 
     * @private
     * @returns {Object} Dark theme variables
     */
    _getDarkThemeVariables() {
        return {
            background: '#ffffff',
            mainBkg: '#ffffff',
            secondBkg: '#ffffff',
            primaryColor: '#ffffff',
            primaryTextColor: '#000000',
            primaryBorderColor: '#000000',
            lineColor: '#000000',
            sectionBkgColor: '#f8f9fa',
            altSectionBkgColor: '#e9ecef',
            gridColor: '#dee2e6',
            nodeBkg: '#ffffff',
            nodeTextColor: '#000000',
            textColor: '#000000',
            labelTextColor: '#000000',
            c0: '#ffffff',
            c1: '#f8f9fa',
            c2: '#e9ecef',
            c3: '#dee2e6',
            c4: '#ced4da'
        };
    }

    /**
     * Gets custom theme variables configuration.
     * 
     * @private
     * @returns {Object} Custom theme variables
     */
    _getCustomThemeVariables() {
        return {
            background: '#ffffff',
            mainBkg: '#ffffff',
            secondBkg: '#ffffff',
            primaryColor: '#2563eb',
            primaryTextColor: '#000000',
            primaryBorderColor: '#1d4ed8',
            lineColor: '#f97316',
            sectionBkgColor: '#dbeafe',
            altSectionBkgColor: '#fed7aa',
            gridColor: '#e5e7eb',
            nodeBkg: '#ffffff',
            nodeTextColor: '#000000',
            textColor: '#000000',
            labelTextColor: '#000000',
            c0: '#2563eb',
            c1: '#f97316',
            c2: '#10b981',
            c3: '#8b5cf6',
            c4: '#f59e0b'
        };
    }

    /**
     * Initializes the theme manager with saved settings and setup.
     * 
     * @private
     */
    _initialize() {
        this._loadSavedTheme();
        this._applyTheme(this.currentTheme);
    }

    /**
     * Loads the saved theme from localStorage with error handling.
     * 
     * @private
     */
    _loadSavedTheme() {
        try {
            const savedTheme = localStorage.getItem(ThemeManager.THEME_STORAGE_KEY);
            if (savedTheme && this._isValidTheme(savedTheme)) {
                this.currentTheme = savedTheme;
                console.log(`Loaded saved theme: ${savedTheme}`);
            }
        } catch (error) {
            console.warn('Failed to load saved theme from localStorage:', error);
            // Fallback to default theme
            this.currentTheme = ThemeManager.DEFAULT_THEME_KEY;
        }
    }

    /**
     * Validates if a theme key is valid.
     * 
     * @private
     * @param {string} themeKey - The theme key to validate
     * @returns {boolean} True if the theme is valid
     */
    _isValidTheme(themeKey) {
        return themeKey && typeof themeKey === 'string' && this.themes.hasOwnProperty(themeKey);
    }

    /**
     * Saves the current theme to localStorage with error handling.
     * 
     * @private
     * @param {string} themeKey - The theme key to save
     */
    _saveTheme(themeKey) {
        try {
            localStorage.setItem(ThemeManager.THEME_STORAGE_KEY, themeKey);
            console.log(`Saved theme to localStorage: ${themeKey}`);
        } catch (error) {
            console.warn('Failed to save theme to localStorage:', error);
        }
    }

    /**
     * Cleans up event listeners and resources.
     * Should be called when the theme manager is no longer needed.
     * 
     * @public
     */
    destroy() {
        // Remove all tracked event listeners
        this.eventListeners.forEach((handler, eventId) => {
            document.removeEventListener('click', handler);
        });
        this.eventListeners.clear();
        
        console.log('ThemeManager destroyed and cleaned up');
    }

    /**
     * Creates a theme button for integration with zoom controls.
     * Returns a complete theme selector with popup options.
     * 
     * @public
     * @returns {HTMLElement} The theme button element with integrated popup
     */
    createThemeButton() {
        const themeBtn = this._createThemeButtonElement();
        const themeOptions = this._createThemeOptionsPopup();
        
        // Attach popup to button
        themeBtn.appendChild(themeOptions);
        
        // Setup event listeners with proper cleanup tracking
        this._setupThemeButtonListeners(themeBtn, themeOptions);
        
        return themeBtn;
    }

    /**
     * Creates the main theme button element.
     * 
     * @private
     * @returns {HTMLElement} The theme button element
     */
    _createThemeButtonElement() {
        const themeBtn = document.createElement('button');
        themeBtn.innerHTML = '<i class="fas fa-palette"></i>';
        themeBtn.title = 'Change Theme';
        themeBtn.id = 'theme-selector-btn';
        themeBtn.className = 'zoom-control-btn';
        return themeBtn;
    }

    /**
     * Creates the theme options popup container.
     * 
     * @private
     * @returns {HTMLElement} The theme options popup element
     */
    _createThemeOptionsPopup() {
        const themeOptions = document.createElement('div');
        themeOptions.className = 'theme-options-popup hidden';
        themeOptions.id = 'theme-options-popup';
        
        // Add theme option elements
        Object.entries(this.themes).forEach(([key, theme]) => {
            const themeOption = this._createThemeOptionElement(key, theme);
            themeOptions.appendChild(themeOption);
        });
        
        return themeOptions;
    }

    /**
     * Creates a single theme option element.
     * 
     * @private
     * @param {string} themeKey - The theme key
     * @param {Object} theme - The theme configuration object
     * @returns {HTMLElement} The theme option element
     */
    _createThemeOptionElement(themeKey, theme) {
        const themeOption = document.createElement('div');
        themeOption.className = `theme-option ${themeKey === this.currentTheme ? 'active' : ''}`;
        themeOption.setAttribute('data-theme', themeKey);
        themeOption.style.background = theme.gradient;
        themeOption.title = theme.name;
        return themeOption;
    }

    /**
     * Sets up event listeners for the theme button and options.
     * 
     * @private
     * @param {HTMLElement} themeBtn - The theme button element
     * @param {HTMLElement} themeOptions - The theme options popup element
     */
    _setupThemeButtonListeners(themeBtn, themeOptions) {
        // Toggle theme options on button click
        themeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            themeOptions.classList.toggle('hidden');
        });

        // Handle theme option clicks
        this._setupThemeOptionListeners(themeOptions);
        
        // Close theme options when clicking outside
        this._setupOutsideClickHandler(themeOptions);
    }

    /**
     * Sets up click listeners for individual theme options.
     * 
     * @private
     * @param {HTMLElement} themeOptions - The theme options container
     */
    _setupThemeOptionListeners(themeOptions) {
        const optionElements = themeOptions.querySelectorAll('.theme-option');
        optionElements.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const themeKey = option.getAttribute('data-theme');
                if (this._isValidTheme(themeKey)) {
                    this.switchTheme(themeKey);
                    themeOptions.classList.add('hidden');
                }
            });
        });
    }

    /**
     * Sets up click outside handler to close theme options.
     * 
     * @private
     * @param {HTMLElement} themeOptions - The theme options popup
     */
    _setupOutsideClickHandler(themeOptions) {
        const outsideClickHandler = () => {
            themeOptions.classList.add('hidden');
        };
        
        document.addEventListener('click', outsideClickHandler);
        
        // Track the event listener for cleanup
        const listenerId = `outside-click-${Date.now()}`;
        this.eventListeners.set(listenerId, outsideClickHandler);
    }

    /**
     * Switches to a new theme and updates all related components.
     * 
     * @public
     * @param {string} themeKey - The key of the theme to switch to
     * @returns {boolean} True if theme was switched successfully, false otherwise
     * 
     * @example
     * // Switch to dark theme
     * themeManager.switchTheme('dark');
     */
    switchTheme(themeKey) {
        if (!this._isValidTheme(themeKey)) {
            console.warn(`Invalid theme key: ${themeKey}`);
            return false;
        }
        
        if (themeKey === this.currentTheme) {
            console.log(`Theme '${themeKey}' is already active`);
            return true;
        }
        
        const previousTheme = this.currentTheme;
        this.currentTheme = themeKey;
        
        try {
            // Apply the new theme
            this._applyTheme(themeKey);
            
            // Update UI state
            this._updateThemeOptionStates();
            
            // Save to localStorage
            this._saveTheme(themeKey);
            
            // Re-render the diagram with new theme
            this.renderer.reRender();
            
            console.log(`Theme switched from '${previousTheme}' to '${themeKey}'`);
            return true;
            
        } catch (error) {
            console.error('Error switching theme:', error);
            // Rollback to previous theme
            this.currentTheme = previousTheme;
            return false;
        }
    }

    /**
     * Updates the active state of theme options in the UI.
     * 
     * @private
     */
    _updateThemeOptionStates() {
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(option => {
            const themeKey = option.getAttribute('data-theme');
            option.classList.toggle('active', themeKey === this.currentTheme);
        });
    }

    /**
     * Applies a theme configuration to Mermaid and the application.
     * 
     * @private
     * @param {string} themeKey - The theme key to apply
     * @throws {Error} If theme application fails
     */
    _applyTheme(themeKey) {
        const theme = this.themes[themeKey];
        if (!theme) {
            throw new Error(`Theme '${themeKey}' not found`);
        }
        
        try {
            // Update Mermaid configuration with theme-specific settings
            const mermaidConfig = {
                ...ThemeManager.MERMAID_BASE_CONFIG,
                theme: theme.mermaidTheme,
                themeVariables: theme.variables
            };
            
            window.mermaid.initialize(mermaidConfig);
            
            // Apply theme to output container
            this._applyThemeToOutput();
            
            console.log(`Applied theme: ${theme.name}`);
            
        } catch (error) {
            throw new Error(`Failed to apply theme '${themeKey}': ${error.message}`);
        }
    }

    /**
     * Applies theme styling to the output container.
     * Manages CSS classes for visual theming.
     * 
     * @private
     */
    _applyThemeToOutput() {
        const outputContainer = document.getElementById('mermaidOutput');
        if (!outputContainer) {
            console.warn('Output container not found for theme application');
            return;
        }
        
        const currentThemeConfig = this.themes[this.currentTheme];
        if (!currentThemeConfig) {
            console.warn(`Theme configuration not found for: ${this.currentTheme}`);
            return;
        }
        
        // Remove all existing theme classes
        Object.values(this.themes).forEach(theme => {
            outputContainer.classList.remove(theme.cssClass);
        });
        
        // Add current theme class
        outputContainer.classList.add(currentThemeConfig.cssClass);
    }

    // ============================================================================
    // PUBLIC API METHODS
    // ============================================================================

    /**
     * Gets the current active theme key.
     * 
     * @public
     * @returns {string} The current theme key
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Gets the current theme configuration object.
     * 
     * @public
     * @returns {Object} The current theme configuration
     */
    getCurrentThemeConfig() {
        return this.themes[this.currentTheme];
    }

    /**
     * Gets all available theme definitions.
     * 
     * @public
     * @returns {Object} All theme configurations
     */
    getAvailableThemes() {
        return { ...this.themes }; // Return a copy to prevent external modification
    }

    /**
     * Applies theme styling to the output container.
     * Public method for external access (used by renderer).
     * 
     * @public
     */
    applyThemeToOutput() {
        this._applyThemeToOutput();
    }

    // ============================================================================
    // DEPRECATED METHODS - Kept for backward compatibility, will be removed in v2.0
    // ============================================================================

    /**
     * @deprecated This method is no longer needed. Theme initialization is automatic.
     */
    init() {
        console.warn('init() is deprecated. Theme initialization is automatic.');
    }

    /**
     * @deprecated This method is no longer needed. Theme selector is created via createThemeButton().
     */
    createThemeSelector() {
        console.warn('createThemeSelector() is deprecated. Use createThemeButton() instead.');
    }

    /**
     * @deprecated Event listeners are set up automatically. This method is no longer needed.
     */
    setupEventListeners() {
        console.warn('setupEventListeners() is deprecated. Event listeners are set up automatically.');
    }

    /**
     * @deprecated Use _applyTheme instead. Will be removed in v2.0.
     */
    applyTheme(themeKey) {
        console.warn('applyTheme() is deprecated. Use switchTheme() instead.');
        return this.switchTheme(themeKey);
    }

    /**
     * @deprecated Theme variables are now handled internally. Will be removed in v2.0.
     */
    getThemeVariables(themeKey) {
        console.warn('getThemeVariables() is deprecated. Theme variables are handled internally.');
        const theme = this.themes[themeKey];
        return theme ? theme.variables : null;
    }

    /**
     * @deprecated Use _createThemeOptionElement instead. Will be removed in v2.0.
     */
    updateThemeOption(option, themeKey) {
        console.warn('updateThemeOption() is deprecated. Theme options are created automatically.');
        const theme = this.themes[themeKey];
        if (theme && option) {
            option.style.background = theme.gradient;
        }
    }

    /**
     * @deprecated Use _setupThemeButtonListeners instead. Will be removed in v2.0.
     */
    setupThemeButtonListeners(themeBtn) {
        console.warn('setupThemeButtonListeners() is deprecated. Event listeners are set up automatically.');
    }
}
