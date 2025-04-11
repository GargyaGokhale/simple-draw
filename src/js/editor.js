export class Editor {
    constructor() {
        this.textarea = document.getElementById('mermaidInput');
        this.renderBtn = document.getElementById('renderBtn');
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.renderBtn.addEventListener('click', () => {
            console.log('Render button clicked');
            const content = this.getDiagramContent();
            const event = new CustomEvent('diagram-update', {
                detail: { content }
            });
            document.dispatchEvent(event);
        });
    }

    getDiagramContent() {
        return this.textarea.value;
    }

    setContent(content) {
        this.textarea.value = content;
    }
}