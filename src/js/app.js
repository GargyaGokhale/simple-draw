import { Editor } from './editor.js';
import { Renderer } from './renderer.js';
import { ExportManager } from './exportManager.js';

class App {
    constructor() {
        console.log('Initializing application...');
        this.editor = new Editor();
        this.renderer = new Renderer();
        this.exportManager = new ExportManager();

        // Set initial example diagram
        const exampleDiagram = `graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B`;
        
        this.editor.setContent(exampleDiagram);
        
        // Trigger initial render
        setTimeout(() => {
            document.getElementById('renderBtn').click();
            console.log('Initial render triggered');
        }, 100);
    }
}

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM content loaded');
    new App();
});