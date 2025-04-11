export class Renderer {
    constructor() {
        this.outputDiv = document.getElementById('mermaidOutput');
        // Initialize Mermaid with safe configuration
        mermaid.initialize({ 
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose'
        });
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
            
            // Generate unique ID for the diagram
            const id = `mermaid-diagram-${Date.now()}`;
            
            // Render the diagram
            const { svg } = await mermaid.render(id, content);
            this.outputDiv.innerHTML = svg;
            
            console.log('Diagram rendered successfully');
        } catch (error) {
            console.error('Mermaid rendering error:', error);
            this.outputDiv.innerHTML = `<p style="color: red;">Error rendering diagram: ${error.message}</p>`;
        }
    }
}