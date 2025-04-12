export class Renderer {
    constructor() {
        this.outputDiv = document.getElementById('mermaidOutput');
        // Initialize Mermaid with safe configuration
        window.mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'strict',
            logLevel: 'debug', // Enable detailed logging
            flowchart: { htmlLabels: true } // Ensure flowchart diagrams render correctly
        });
        
        // Override Mermaid's default error handling
        window.mermaid.parseError = (err) => {
            console.error('Custom Mermaid error handler:', err);
        };
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('diagram-update', (event) => {
            this.renderDiagram(event.detail.content);
        });
    }

    async renderDiagram(content) {
        if (!content || content.trim() === '') {
            this.outputDiv.innerHTML = '<p style="color: orange;">Enter diagram code and click render</p>';
            return;
        }

        try {
            // Clear previous content
            this.outputDiv.innerHTML = '';
            window.mermaid.initialize({ // Reinitialize Mermaid to reset its state
                startOnLoad: false,
                theme: 'default',
                securityLevel: 'strict',
                logLevel: 'debug',
                flowchart: { htmlLabels: true }
            });
            const footer = document.querySelector('footer');
            if (footer && footer.innerHTML.includes('syntax error')) {
                footer.innerHTML = footer.innerHTML.replace(/syntax error.*/, '');
            }
            
            // Generate unique ID for the diagram
            const id = `mermaid-diagram-${Date.now()}`;
            
            // Render the diagram
            const sanitizedContent = this.sanitizeInput(content);
            console.log('Sanitized content for rendering:', sanitizedContent);
            const { svg } = await window.mermaid.render(id, sanitizedContent);
            this.outputDiv.innerHTML = svg;
            
            console.log('Diagram rendered successfully');
        } catch (error) {
            console.error('Mermaid rendering error:', error);
            
            // Remove any Mermaid.js-generated div elements
            const errorDivs = document.querySelectorAll('div[id^="dmermaid-diagram"]');
            errorDivs.forEach((div) => div.remove());
            
            this.outputDiv.innerHTML = `<p style="color: red;">Error rendering diagram: Please check your syntax and try again.</p>`;
        }
    }
    
    sanitizeInput(input) {
        return input.replace(/[<>&"]/g, (char) => {
            switch (char) {
                case '<': return '&lt;';
                case '&': return '&amp;';
                case '"': return '&quot;';
                default: return char;
            }
        });
        return div.innerHTML; // Escapes potentially harmful characters
    }
}