/**
 * App class serves as the main application controller for Simple Draw.
 * Manages initialization, configuration, and coordination between all application components.
 * Provides lifecycle management, error handling, and component communication.
 * 
 * @class App
 * @author Gargya Gokhale
 * @version 1.0.0
 */

import { Editor } from './editor.js';
import { Renderer } from './renderer.js';
import { ExportManager } from './exportManager.js';
import { ThemeManager } from './themeManager.js';

/**
 * Main application class that orchestrates all components of Simple Draw.
 * Handles initialization, configuration, error management, and component coordination.
 */
export class App {
    // Application configuration constants
    static CONFIG = {
        APP_NAME: 'Simple Draw',
        VERSION: '1.0.0',
        INIT_DELAY: 100, // Milliseconds to wait before initial render
        AUTO_RENDER_INITIAL: true,
        DEFAULT_THEME: 'default',
        MAX_INIT_RETRIES: 3,
        RETRY_DELAY: 500
    };

    // Default example diagram configuration
    static DEFAULT_EXAMPLE = {
        title: 'Welcome Example',
        description: 'A sample flowchart with subgraphs demonstrating Simple Draw capabilities',
        diagram: `graph TD
    A[Start] --> B{Check User}
    B -->|Valid| C[Process Request]
    B -->|Invalid| D[Return Error]
    
    subgraph auth[Authentication]
        E[Verify Token]
        F[Check Permissions]
        E --> F
    end
    
    subgraph processing[Data Processing]
        G[Parse Data]
        H[Transform]
        I[Save Result]
        G --> H
        H --> I
    end
    
    C --> E
    F --> G
    I --> J[Success Response]
    D --> K[Error Response]`
    };

    // Required DOM element selectors
    static REQUIRED_ELEMENTS = {
        RENDER_BUTTON: '#renderBtn',
        INPUT_TEXTAREA: '#mermaidInput',
        OUTPUT_CONTAINER: '#mermaidOutput'
    };

    // Error messages
    static ERROR_MESSAGES = {
        INIT_FAILED: 'Application initialization failed',
        COMPONENT_INIT_FAILED: 'Component initialization failed',
        DOM_NOT_READY: 'Required DOM elements not found',
        INVALID_CONFIG: 'Invalid configuration provided',
        RENDER_FAILED: 'Initial render failed'
    };

    /**
     * Creates an instance of the App.
     * 
     * @constructor
     * @param {Object} [options={}] - Configuration options for the application
     * @param {boolean} [options.autoRenderInitial] - Whether to automatically render initial example
     * @param {string} [options.initialExample] - Custom initial example diagram
     * @param {string} [options.defaultTheme] - Default theme to apply
     * @param {boolean} [options.enableGlobalAccess] - Whether to make app globally available
     * @param {Function} [options.onInitComplete] - Callback when initialization completes
     * @param {Function} [options.onError] - Custom error handler
     * @throws {Error} If initialization fails after retries
     */
    constructor(options = {}) {
        // Configuration with defaults
        this.config = {
            autoRenderInitial: options.autoRenderInitial ?? App.CONFIG.AUTO_RENDER_INITIAL,
            initialExample: options.initialExample || App.DEFAULT_EXAMPLE.diagram,
            defaultTheme: options.defaultTheme || App.CONFIG.DEFAULT_THEME,
            enableGlobalAccess: options.enableGlobalAccess ?? true,
            onInitComplete: options.onInitComplete || null,
            onError: options.onError || this._defaultErrorHandler.bind(this)
        };

        // Application state
        this.isInitialized = false;
        this.components = new Map();
        this.initRetryCount = 0;
        
        // Start initialization
        this._initialize();
        
        console.log(`${App.CONFIG.APP_NAME} v${App.CONFIG.VERSION} constructor completed`);
    }

    /**
     * Initializes the application with error handling and retry logic.
     * 
     * @private
     * @returns {Promise<void>}
     */
    async _initialize() {
        try {
            console.log('Initializing application components...');
            
            // Validate DOM readiness
            await this._validateDOMReadiness();
            
            // Initialize components in order
            await this._initializeComponents();
            
            // Setup component communication
            this._setupComponentCommunication();
            
            // Load initial content
            await this._loadInitialContent();
            
            // Apply global access if enabled
            if (this.config.enableGlobalAccess) {
                this._setupGlobalAccess();
            }
            
            // Mark as initialized
            this.isInitialized = true;
            
            // Call completion callback if provided
            if (this.config.onInitComplete) {
                this.config.onInitComplete(this);
            }
            
            console.log('Application initialized successfully');
            
        } catch (error) {
            await this._handleInitializationError(error);
        }
    }

    /**
     * Validates that required DOM elements are available.
     * 
     * @private
     * @returns {Promise<void>}
     * @throws {Error} If required elements are missing
     */
    async _validateDOMReadiness() {
        const missingElements = [];
        
        for (const [name, selector] of Object.entries(App.REQUIRED_ELEMENTS)) {
            const element = document.querySelector(selector);
            if (!element) {
                missingElements.push(`${name} (${selector})`);
            }
        }
        
        if (missingElements.length > 0) {
            throw new Error(`${App.ERROR_MESSAGES.DOM_NOT_READY}: ${missingElements.join(', ')}`);
        }
        
        console.log('DOM validation completed successfully');
    }

    /**
     * Initializes all application components in the correct order.
     * 
     * @private
     * @returns {Promise<void>}
     * @throws {Error} If any component fails to initialize
     */
    async _initializeComponents() {
        try {
            // Initialize core components
            console.log('Initializing Editor...');
            this.editor = new Editor();
            this.components.set('editor', this.editor);
            
            console.log('Initializing Renderer...');
            this.renderer = new Renderer();
            this.components.set('renderer', this.renderer);
            
            console.log('Initializing ExportManager...');
            this.exportManager = new ExportManager();
            this.components.set('exportManager', this.exportManager);
            
            // Theme manager needs renderer reference
            console.log('Initializing ThemeManager...');
            this.themeManager = new ThemeManager(this.renderer);
            this.components.set('themeManager', this.themeManager);
            
            console.log('All components initialized successfully');
            
        } catch (error) {
            throw new Error(`${App.ERROR_MESSAGES.COMPONENT_INIT_FAILED}: ${error.message}`);
        }
    }

    /**
     * Sets up communication channels between components.
     * Currently uses global access pattern for backward compatibility.
     * 
     * @private
     */
    _setupComponentCommunication() {
        // The current architecture uses window.app for component communication
        // This is set up in _setupGlobalAccess() method
        // Future versions could implement a proper event bus or dependency injection
        
        console.log('Component communication will be established via global access');
    }

    /**
     * Loads initial content and triggers first render if configured.
     * 
     * @private
     * @returns {Promise<void>}
     */
    async _loadInitialContent() {
        try {
            // Set initial example content
            if (this.config.initialExample && this.editor) {
                this.editor.setContent(this.config.initialExample);
                console.log('Initial example content loaded');
            }
            
            // Trigger initial render if enabled
            if (this.config.autoRenderInitial) {
                await this._triggerInitialRender();
            }
            
        } catch (error) {
            console.warn('Failed to load initial content:', error);
            // Don't throw here - this is not critical for app functionality
        }
    }

    /**
     * Triggers the initial render with proper timing and error handling.
     * 
     * @private
     * @returns {Promise<void>}
     */
    async _triggerInitialRender() {
        return new Promise((resolve, reject) => {
            // Use a small delay to ensure all components are ready
            setTimeout(async () => {
                try {
                    const renderBtn = document.querySelector(App.REQUIRED_ELEMENTS.RENDER_BUTTON);
                    if (renderBtn) {
                        renderBtn.click();
                        console.log('Initial render triggered successfully');
                        resolve();
                    } else {
                        throw new Error('Render button not found');
                    }
                } catch (error) {
                    console.error('Initial render failed:', error);
                    reject(new Error(`${App.ERROR_MESSAGES.RENDER_FAILED}: ${error.message}`));
                }
            }, App.CONFIG.INIT_DELAY);
        });
    }

    /**
     * Sets up global access to the application instance.
     * 
     * @private
     */
    _setupGlobalAccess() {
        window.app = this;
        console.log('Global app access enabled');
    }

    /**
     * Handles initialization errors with retry logic.
     * 
     * @private
     * @param {Error} error - The initialization error
     */
    async _handleInitializationError(error) {
        this.initRetryCount++;
        
        console.error(`Initialization attempt ${this.initRetryCount} failed:`, error);
        
        if (this.initRetryCount < App.CONFIG.MAX_INIT_RETRIES) {
            console.log(`Retrying initialization in ${App.CONFIG.RETRY_DELAY}ms...`);
            
            setTimeout(() => {
                this._initialize();
            }, App.CONFIG.RETRY_DELAY * this.initRetryCount);
        } else {
            // Final failure - call error handler
            const finalError = new Error(`${App.ERROR_MESSAGES.INIT_FAILED}: ${error.message}`);
            this.config.onError(finalError);
        }
    }

    /**
     * Default error handler for application errors.
     * 
     * @private
     * @param {Error} error - The error to handle
     */
    _defaultErrorHandler(error) {
        console.error('Application error:', error);
        
        // Show user-friendly error message
        const message = `An error occurred while starting ${App.CONFIG.APP_NAME}.\n\nPlease refresh the page and try again.\n\nTechnical details: ${error.message}`;
        alert(message);
    }

    // ============================================================================
    // PUBLIC API METHODS
    // ============================================================================

    /**
     * Gets the current application configuration.
     * 
     * @public
     * @returns {Object} Current configuration object
     */
    getConfig() {
        return { ...this.config }; // Return a copy to prevent external modification
    }

    /**
     * Updates the application configuration.
     * 
     * @public
     * @param {Object} newConfig - New configuration options
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('Application configuration updated', this.config);
    }

    /**
     * Gets a reference to a specific component.
     * 
     * @public
     * @param {string} componentName - Name of the component ('editor', 'renderer', 'exportManager', 'themeManager')
     * @returns {Object|null} The component instance or null if not found
     * 
     * @example
     * const editor = app.getComponent('editor');
     * if (editor) {
     *   editor.setContent('graph TD; A --> B');
     * }
     */
    getComponent(componentName) {
        return this.components.get(componentName) || null;
    }

    /**
     * Gets all initialized components.
     * 
     * @public
     * @returns {Map<string, Object>} Map of component names to instances
     */
    getAllComponents() {
        return new Map(this.components); // Return a copy
    }

    /**
     * Checks if the application is fully initialized.
     * 
     * @public
     * @returns {boolean} True if initialization is complete
     */
    isReady() {
        return this.isInitialized;
    }

    /**
     * Gets application information.
     * 
     * @public
     * @returns {Object} Application information
     */
    getInfo() {
        return {
            name: App.CONFIG.APP_NAME,
            version: App.CONFIG.VERSION,
            isInitialized: this.isInitialized,
            componentCount: this.components.size,
            components: Array.from(this.components.keys())
        };
    }

    /**
     * Refreshes the application by re-rendering current content.
     * 
     * @public
     * @returns {Promise<boolean>} True if refresh was successful
     */
    async refresh() {
        try {
            if (!this.isInitialized) {
                throw new Error('Application not initialized');
            }
            
            const renderBtn = document.querySelector(App.REQUIRED_ELEMENTS.RENDER_BUTTON);
            if (renderBtn) {
                renderBtn.click();
                console.log('Application refreshed successfully');
                return true;
            } else {
                throw new Error('Render button not available');
            }
        } catch (error) {
            console.error('Failed to refresh application:', error);
            return false;
        }
    }

    /**
     * Resets the application to its initial state.
     * 
     * @public
     * @returns {Promise<boolean>} True if reset was successful
     */
    async reset() {
        try {
            if (this.editor) {
                this.editor.setContent(this.config.initialExample);
            }
            
            if (this.themeManager) {
                this.themeManager.switchTheme(this.config.defaultTheme);
            }
            
            await this.refresh();
            
            console.log('Application reset to initial state');
            return true;
            
        } catch (error) {
            console.error('Failed to reset application:', error);
            return false;
        }
    }

    /**
     * Cleans up application resources and components.
     * Should be called when the application is being destroyed.
     * 
     * @public
     */
    destroy() {
        try {
            // Destroy all components that have destroy methods
            this.components.forEach((component, name) => {
                if (typeof component.destroy === 'function') {
                    try {
                        component.destroy();
                        console.log(`${name} component destroyed`);
                    } catch (error) {
                        console.warn(`Failed to destroy ${name} component:`, error);
                    }
                }
            });
            
            // Clear component references
            this.components.clear();
            
            // Remove global access
            if (this.config.enableGlobalAccess && window.app === this) {
                delete window.app;
            }
            
            // Reset state
            this.isInitialized = false;
            
            console.log('Application destroyed and cleaned up');
            
        } catch (error) {
            console.error('Error during application destruction:', error);
        }
    }

    // ============================================================================
    // STATIC UTILITY METHODS
    // ============================================================================

    /**
     * Creates and initializes a new App instance when DOM is ready.
     * This is the recommended way to start the application.
     * 
     * @static
     * @param {Object} [options={}] - Configuration options
     * @returns {Promise<App>} Promise that resolves to the initialized App instance
     * 
     * @example
     * // Basic initialization
     * App.createWhenReady().then(app => {
     *   console.log('App is ready!');
     * });
     * 
     * @example
     * // With custom configuration
     * App.createWhenReady({
     *   defaultTheme: 'dark',
     *   autoRenderInitial: false,
     *   onInitComplete: (app) => console.log('Custom init complete')
     * });
     */
    static createWhenReady(options = {}) {
        return new Promise((resolve, reject) => {
            const initializeApp = () => {
                try {
                    console.log('DOM content loaded, initializing application...');
                    
                    // Add completion callback to options
                    const appOptions = {
                        ...options,
                        onInitComplete: (app) => {
                            // Call user callback if provided
                            if (options.onInitComplete) {
                                options.onInitComplete(app);
                            }
                            // Resolve the promise
                            resolve(app);
                        },
                        onError: (error) => {
                            // Call user error handler if provided
                            if (options.onError) {
                                options.onError(error);
                            }
                            // Reject the promise
                            reject(error);
                        }
                    };
                    
                    // Create the app instance
                    new App(appOptions);
                    
                } catch (error) {
                    console.error('Error creating application:', error);
                    reject(error);
                }
            };

            // Initialize when DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initializeApp, { once: true });
            } else {
                // DOM is already ready
                setTimeout(initializeApp, 0);
            }
        });
    }

    /**
     * Gets the version information of the application.
     * 
     * @static
     * @returns {Object} Version information
     */
    static getVersion() {
        return {
            name: App.CONFIG.APP_NAME,
            version: App.CONFIG.VERSION,
            buildDate: new Date().toISOString()
        };
    }
}

// ============================================================================
// AUTO-INITIALIZATION
// ============================================================================

// Auto-initialize the application when this module is loaded
// This maintains backward compatibility with the original approach
App.createWhenReady()
    .then(app => {
        console.log(`${App.CONFIG.APP_NAME} v${App.CONFIG.VERSION} initialized successfully`);
    })
    .catch(error => {
        console.error('Failed to auto-initialize application:', error);
    });

// Export the App class as default
export default App;
