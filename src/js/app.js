import { Editor } from './editor.js';
import { Renderer } from './renderer.js';
import { ExportManager } from './exportManager.js';
import { ThemeManager } from './themeManager.js';

class App {
    constructor() {
        console.log('Initializing application...');
        this.editor = new Editor();
        this.renderer = new Renderer();
        this.exportManager = new ExportManager();
        
        // Initialize theme manager after renderer is ready
        this.themeManager = new ThemeManager(this.renderer);

        // Set initial example diagram with subgraphs
        const exampleDiagram = `graph TD
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
    D --> K[Error Response]`;
        
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
    try {
        console.log('DOM content loaded');
        window.app = new App(); // Make app globally available
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error initializing the application:', error);
        alert('An error occurred while starting the application.');
    }
});