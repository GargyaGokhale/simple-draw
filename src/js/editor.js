export class Editor {
    constructor() {
        this.textarea = document.getElementById('mermaidInput');
        this.renderBtn = document.getElementById('renderBtn');
        this.infoBtn = document.getElementById('infoBtn');
        this.infoPopup = this.createInfoPopup();
        this.setupEventListeners();
        this.setupCopyButton();
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

        this.infoBtn.addEventListener('click', () => {
            this.infoPopup.classList.add('active');
        });

        this.infoPopup.querySelector('.close-btn').addEventListener('click', () => {
            this.infoPopup.classList.remove('active');
        });
    }
    
    setupCopyButton() {
        const copyBtn = document.getElementById('copyExample');
        const exampleCode = document.getElementById('exampleCode');
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(exampleCode.textContent.trim())
                .then(() => alert('Example code copied to clipboard!'))
                .catch(err => console.error('Failed to copy text: ', err));
        });
    }

    createInfoPopup() {
        const popup = document.createElement('div');
        popup.className = 'info-popup';
        popup.innerHTML = `
            <button class="close-btn button"><i class="fas fa-times"></i></button>
            <h2>Example Scripts</h2>
            <div class="code-container">
                <pre id="exampleCode">
graph TD
    A[Start] --> B[Process]
    B --> C[End]
                </pre>
                <button class="button copy-btn" id="copyExample">Copy</button>
            </div>
        `;
        document.body.appendChild(popup);
        return popup;
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
