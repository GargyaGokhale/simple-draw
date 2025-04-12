import { loadExamples } from './loadExamples.js';

export class Editor {
    constructor() {
        console.log('Initializing Editor...');
        this.textarea = document.getElementById('mermaidInput');
        this.renderBtn = document.getElementById('renderBtn');
        this.infoBtn = document.getElementById('infoBtn');
        this.infoPopup = this.createInfoPopup();
        console.log('Info popup created successfully.');
        this.setupEventListeners();
        this.setupCopyButton();

        // Remove the redundant examples container if it exists
        const redundantExamples = document.getElementById('examples');
        if (redundantExamples) {
            redundantExamples.remove();
        }

        // Remove infoBtn onclick attribute to prevent double loading
        if (this.infoBtn) {
            this.infoBtn.removeAttribute('onclick');
        }
    }

    setupEventListeners() {
        if (this.renderBtn) {
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
        
        if (this.infoBtn) {
            this.infoBtn.addEventListener('click', () => {
                this.infoPopup.classList.add('active');
                loadExamples().then(html => {
                    const contentArea = this.infoPopup.querySelector('.info-content');
                    if (contentArea) {
                        contentArea.innerHTML = html;
                        this.setupSnippetCopyButtons();
                    }
                });
            });
        }
        
        if (this.infoPopup && this.infoPopup.querySelector('.close-btn')) {
            this.infoPopup.querySelector('.close-btn').addEventListener('click', () => {
                this.infoPopup.classList.remove('active');
            });
        }
    }
    
    setupCopyButton() {
        const copyBtn = document.getElementById('copyExample');
        const exampleCode = document.getElementById('exampleCode');
        
        if (copyBtn && exampleCode) {
            copyBtn.addEventListener('click', function() {
                navigator.clipboard.writeText(exampleCode.textContent.trim())
                    .then(() => alert('Example code copied to clipboard!'))
                    .catch(err => console.error('Failed to copy text: ', err));
            });
        }
    }
    
    setupSnippetCopyButtons() {
        const copyButtons = this.infoPopup.querySelectorAll('.copy-btn');
        
        copyButtons.forEach(button => {
            button.addEventListener('click', () => {
                const codeElement = button.previousElementSibling.querySelector('code');
                if (codeElement) {
                    navigator.clipboard.writeText(codeElement.textContent.trim())
                        .then(() => alert('Example code copied to clipboard!'))
                        .catch(err => console.error('Failed to copy text: ', err));
                }
            });
        });
    }

    createInfoPopup() {
        const popup = document.createElement('div');
        popup.className = 'info-popup';
        
        // Create basic structure without loading examples yet
        popup.innerHTML = `
            <button class="close-btn button"><i class="fas fa-times"></i></button>
            <div class="info-content">
                <p>Loading examples...</p>
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
    }
}
