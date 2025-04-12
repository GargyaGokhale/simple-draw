export class Editor {
    constructor() {
        this.textarea = document.getElementById('mermaidInput');
        this.renderBtn = document.getElementById('renderBtn');
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.renderBtn.addEventListener('click', () => {
            try {
                console.log('Render button clicked');
                const content = this.sanitizeInput(this.getDiagramContent());
                const event = new CustomEvent('diagram-update', {
                    detail: { content }
                });
                document.dispatchEvent(event);
            } catch (error) {
                console.error('Error processing diagram content:', error);
                alert('An error occurred while processing your input.');
            }
        });
    }

    getDiagramContent() {
        return this.textarea.value.trim();
    }

    setContent(content) {
        this.textarea.value = content;
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