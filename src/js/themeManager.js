export class ThemeManager {
    constructor(renderer) {
        this.renderer = renderer;
        this.currentTheme = 'default';
        this.themes = {
            default: {
                name: 'Default',
                mermaidTheme: 'default',
                cssClass: 'theme-default'
            },
            dark: {
                name: 'Black & White',
                mermaidTheme: 'base',
                cssClass: 'theme-dark'
            },
            custom: {
                name: 'Blue Orange',
                mermaidTheme: 'base',
                cssClass: 'theme-custom'
            }
        };
        
        this.init();
    }

    init() {
        // Load saved theme from localStorage
        const savedTheme = localStorage.getItem('mermaid-theme');
        if (savedTheme && this.themes[savedTheme]) {
            this.currentTheme = savedTheme;
        }
        
        this.createThemeSelector();
        this.applyTheme(this.currentTheme);
        this.setupEventListeners();
    }

    createThemeSelector() {
        // Theme selector will be added to zoom controls, not as separate element
        // This will be called from the renderer when zoom controls are created
    }

    // Create theme button for zoom controls tray
    createThemeButton() {
        const themeBtn = document.createElement('button');
        themeBtn.innerHTML = '<i class="fas fa-palette"></i>';
        themeBtn.title = 'Change Theme';
        themeBtn.id = 'theme-selector-btn';
        themeBtn.className = 'zoom-control-btn';
        
        // Create theme options popup
        const themeOptions = document.createElement('div');
        themeOptions.className = 'theme-options-popup hidden';
        themeOptions.id = 'theme-options-popup';
        
        Object.entries(this.themes).forEach(([key, theme]) => {
            const themeOption = document.createElement('div');
            themeOption.className = `theme-option ${key === this.currentTheme ? 'active' : ''}`;
            themeOption.setAttribute('data-theme', key);
            // Remove tooltip attribute - no text labels needed
            this.updateThemeOption(themeOption, key);
            themeOptions.appendChild(themeOption);
        });
        
        // Add popup to button (will be positioned relative to button)
        themeBtn.appendChild(themeOptions);
        
        // Add event listeners
        this.setupThemeButtonListeners(themeBtn);
        
        return themeBtn;
    }

    updateThemeOption(option, themeKey) {
        switch(themeKey) {
            case 'default':
                option.style.background = 'linear-gradient(45deg, #6c63ff 50%, #a855f7 50%)';
                break;
            case 'dark':
                option.style.background = 'linear-gradient(45deg, #000000 50%, #ffffff 50%)';
                break;
            case 'custom':
                option.style.background = 'linear-gradient(45deg, #2563eb 50%, #f97316 50%)';
                break;
        }
    }

    setupThemeButtonListeners(themeBtn) {
        const themeOptions = themeBtn.querySelector('.theme-options-popup');
        
        // Toggle theme options on click
        themeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            themeOptions.classList.toggle('hidden');
        });

        // Handle theme option clicks
        const optionElements = themeOptions.querySelectorAll('.theme-option');
        optionElements.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const themeKey = option.getAttribute('data-theme');
                this.switchTheme(themeKey);
                themeOptions.classList.add('hidden');
            });
        });

        // Close theme options when clicking outside
        document.addEventListener('click', () => {
            themeOptions.classList.add('hidden');
        });
    }

    setupEventListeners() {
        // Event listeners are now handled in setupThemeButtonListeners
        // Called when theme button is created in zoom controls
    }

    switchTheme(themeKey) {
        if (!this.themes[themeKey]) return;
        
        this.currentTheme = themeKey;
        this.applyTheme(themeKey);

        // Update active state of theme options
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(option => {
            option.classList.remove('active');
            if (option.getAttribute('data-theme') === themeKey) {
                option.classList.add('active');
            }
        });
        
        // Save to localStorage
        localStorage.setItem('mermaid-theme', themeKey);
        
        // Re-render the diagram with new theme
        this.renderer.reRender();
    }

    applyTheme(themeKey) {
        const theme = this.themes[themeKey];
        
        // Update Mermaid configuration
        window.mermaid.initialize({
            startOnLoad: false,
            theme: theme.mermaidTheme,
            securityLevel: 'loose',
            logLevel: 'debug',
            flowchart: { 
                htmlLabels: true,
                subGraphTitleMargin: { top: 0, bottom: 0 }
            },
            themeVariables: this.getThemeVariables(themeKey)
        });

        // Apply theme to output container if it exists
        this.applyThemeToOutput();
    }

    getThemeVariables(themeKey) {
        switch (themeKey) {
            case 'custom':
                return {
                    // Blue and Orange theme variables with white background
                    background: '#ffffff',
                    mainBkg: '#ffffff',
                    secondBkg: '#ffffff',
                    primaryColor: '#2563eb', // Blue
                    primaryTextColor: '#000000', // Black text for better contrast
                    primaryBorderColor: '#1d4ed8',
                    lineColor: '#f97316', // Orange
                    sectionBkgColor: '#dbeafe', // Light blue
                    altSectionBkgColor: '#fed7aa', // Light orange
                    gridColor: '#e5e7eb',
                    // Text colors for different elements
                    nodeBkg: '#ffffff',
                    nodeTextColor: '#000000',
                    textColor: '#000000',
                    labelTextColor: '#000000',
                    c0: '#2563eb', // Blue
                    c1: '#f97316', // Orange
                    c2: '#10b981', // Emerald
                    c3: '#8b5cf6', // Purple
                    c4: '#f59e0b', // Amber
                };
            case 'dark':
                return {
                    // Black and white theme variables with white background
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
                    // Text colors for different elements
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
            default:
                return {
                    // Ensure white background for default theme too
                    background: '#ffffff',
                    mainBkg: '#ffffff',
                    secondBkg: '#ffffff',
                    textColor: '#000000',
                    labelTextColor: '#000000'
                };
        }
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    // Method to apply theme class to output container (used after rendering)
    applyThemeToOutput() {
        const outputContainer = document.getElementById('mermaidOutput');
        const theme = this.themes[this.currentTheme];
        
        if (outputContainer && theme) {
            // Remove existing theme classes
            Object.values(this.themes).forEach(t => {
                outputContainer.classList.remove(t.cssClass);
            });
            
            // Add current theme class
            outputContainer.classList.add(theme.cssClass);
        }
    }
}
