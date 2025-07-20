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
        const header = document.querySelector('.app-header');
        const themeSelector = document.createElement('div');
        themeSelector.className = 'theme-selector';
        themeSelector.innerHTML = `
            <label for="themeSelect">Theme:</label>
            <select id="themeSelect">
                ${Object.entries(this.themes).map(([key, theme]) => 
                    `<option value="${key}" ${key === this.currentTheme ? 'selected' : ''}>${theme.name}</option>`
                ).join('')}
            </select>
        `;
        header.appendChild(themeSelector);
    }

    setupEventListeners() {
        const themeSelect = document.getElementById('themeSelect');
        themeSelect.addEventListener('change', (e) => {
            this.switchTheme(e.target.value);
        });
    }

    switchTheme(themeKey) {
        if (!this.themes[themeKey]) return;
        
        this.currentTheme = themeKey;
        this.applyTheme(themeKey);
        
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
                    // Blue and Orange theme variables
                    primaryColor: '#2563eb', // Blue
                    primaryTextColor: '#ffffff',
                    primaryBorderColor: '#1d4ed8',
                    lineColor: '#f97316', // Orange
                    sectionBkgColor: '#dbeafe', // Light blue
                    altSectionBkgColor: '#fed7aa', // Light orange
                    gridColor: '#e5e7eb',
                    c0: '#2563eb', // Blue
                    c1: '#f97316', // Orange
                    c2: '#10b981', // Emerald
                    c3: '#8b5cf6', // Purple
                    c4: '#f59e0b', // Amber
                };
            case 'dark':
                return {
                    // Black and white theme variables
                    primaryColor: '#ffffff',
                    primaryTextColor: '#000000',
                    primaryBorderColor: '#000000',
                    lineColor: '#000000',
                    sectionBkgColor: '#f8f9fa',
                    altSectionBkgColor: '#e9ecef',
                    gridColor: '#dee2e6',
                    c0: '#ffffff',
                    c1: '#f8f9fa',
                    c2: '#e9ecef',
                    c3: '#dee2e6',
                    c4: '#ced4da'
                };
            default:
                return {};
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
