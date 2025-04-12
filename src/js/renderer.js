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
        this.zoomLevel = 1;
        this.panEnabled = false;
        this.translateX = 0;
        this.translateY = 0;
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
            
            // After rendering, initialize pan and zoom
            this.addZoomControlsToDOM();
            this.setupZoomAndPan();
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
    }

    addZoomControlsToDOM() {
        // Remove existing controls if any
        const existingControls = document.getElementById('zoom-controls');
        if (existingControls) {
            existingControls.remove();
        }
        
        // Create control container
        const controls = document.createElement('div');
        controls.id = 'zoom-controls';
        controls.style.position = 'absolute';
        controls.style.top = '10px';
        controls.style.right = '10px';
        controls.style.backgroundColor = 'rgba(255, 255, 255, 0.85)';
        controls.style.padding = '5px';
        controls.style.borderRadius = '5px';
        controls.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
        controls.style.zIndex = '100';
        controls.style.display = 'flex';
        controls.style.gap = '5px';
        
        // Create zoom in button
        const zoomInBtn = document.createElement('button');
        zoomInBtn.innerHTML = '+';
        zoomInBtn.title = 'Zoom In';
        zoomInBtn.style.width = '30px';
        zoomInBtn.style.height = '30px';
        zoomInBtn.style.cursor = 'pointer';
        zoomInBtn.style.fontSize = '18px';
        zoomInBtn.style.fontWeight = 'bold';
        zoomInBtn.style.border = '1px solid #ccc';
        zoomInBtn.style.borderRadius = '3px';
        zoomInBtn.addEventListener('click', () => this.zoomIn());
        
        // Create zoom out button
        const zoomOutBtn = document.createElement('button');
        zoomOutBtn.innerHTML = '-';
        zoomOutBtn.title = 'Zoom Out';
        zoomOutBtn.style.width = '30px';
        zoomOutBtn.style.height = '30px';
        zoomOutBtn.style.cursor = 'pointer';
        zoomOutBtn.style.fontSize = '18px';
        zoomOutBtn.style.fontWeight = 'bold';
        zoomOutBtn.style.border = '1px solid #ccc';
        zoomOutBtn.style.borderRadius = '3px';
        zoomOutBtn.addEventListener('click', () => this.zoomOut());
        
        // Create reset button
        const resetBtn = document.createElement('button');
        resetBtn.innerHTML = '↺';
        resetBtn.title = 'Reset Zoom';
        resetBtn.style.width = '30px';
        resetBtn.style.height = '30px';
        resetBtn.style.cursor = 'pointer';
        resetBtn.style.fontSize = '18px';
        resetBtn.style.border = '1px solid #ccc';
        resetBtn.style.borderRadius = '3px';
        resetBtn.addEventListener('click', () => this.resetZoom());
        
        // Create pan toggle button
        const panBtn = document.createElement('button');
        panBtn.innerHTML = '✋';
        panBtn.title = 'Toggle Pan';
        panBtn.id = 'toggle-pan';
        panBtn.style.width = '30px';
        panBtn.style.height = '30px';
        panBtn.style.cursor = 'pointer';
        panBtn.style.fontSize = '16px';
        panBtn.style.border = '1px solid #ccc';
        panBtn.style.borderRadius = '3px';
        panBtn.style.backgroundColor = this.panEnabled ? '#ccc' : '';
        panBtn.addEventListener('click', () => this.togglePan());
        
        // Add buttons to container
        controls.appendChild(zoomInBtn);
        controls.appendChild(zoomOutBtn);
        controls.appendChild(resetBtn);
        controls.appendChild(panBtn);
        
        // Add controls to the diagram container
        this.outputDiv.style.position = 'relative';
        this.outputDiv.appendChild(controls);
    }

    setupZoomAndPan() {
        const svgElement = this.outputDiv.querySelector('svg');
        if (!svgElement) return;
        
        // Set SVG for zooming and panning
        svgElement.style.transition = 'transform 0.2s';
        svgElement.style.transformOrigin = 'center';
        svgElement.style.cursor = this.panEnabled ? 'grab' : 'default';
        
        // Apply current transform
        this.applyTransform(svgElement);
        
        // Setup mouse wheel zoom
        svgElement.onwheel = (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            this.zoom(delta);
        };
        
        // Setup pan functionality
        let isDragging = false;
        let startX, startY;
        
        svgElement.onmousedown = (e) => {
            if (!this.panEnabled) return;
            
            isDragging = true;
            startX = e.clientX - this.translateX;
            startY = e.clientY - this.translateY;
            svgElement.style.cursor = 'grabbing';
            e.preventDefault();
        };
        
        document.onmousemove = (e) => {
            if (!isDragging || !this.panEnabled) return;
            
            this.translateX = e.clientX - startX;
            this.translateY = e.clientY - startY;
            this.applyTransform(svgElement);
        };
        
        document.onmouseup = () => {
            if (!isDragging) return;
            
            isDragging = false;
            if (this.panEnabled) {
                svgElement.style.cursor = 'grab';
            }
        };
        
        // Touch support for mobile
        svgElement.ontouchstart = (e) => {
            if (!this.panEnabled || e.touches.length !== 1) return;
            
            isDragging = true;
            startX = e.touches[0].clientX - this.translateX;
            startY = e.touches[0].clientY - this.translateY;
            e.preventDefault();
        };
        
        svgElement.ontouchmove = (e) => {
            if (!isDragging || !this.panEnabled || e.touches.length !== 1) return;
            
            this.translateX = e.touches[0].clientX - startX;
            this.translateY = e.touches[0].clientY - startY;
            this.applyTransform(svgElement);
            e.preventDefault();
        };
        
        svgElement.ontouchend = () => {
            isDragging = false;
        };
    }
    
    applyTransform(element) {
        element.style.transform = `scale(${this.zoomLevel}) translate(${this.translateX}px, ${this.translateY}px)`;
    }
    
    zoomIn() {
        this.zoom(0.1);
    }
    
    zoomOut() {
        this.zoom(-0.1);
    }
    
    zoom(delta) {
        // Limit zoom between 0.2 and 5
        const newZoom = Math.max(0.2, Math.min(5, this.zoomLevel + delta));
        this.zoomLevel = newZoom;
        
        const svgElement = this.outputDiv.querySelector('svg');
        if (svgElement) {
            this.applyTransform(svgElement);
        }
    }
    
    resetZoom() {
        this.zoomLevel = 1;
        this.translateX = 0;
        this.translateY = 0;
        
        const svgElement = this.outputDiv.querySelector('svg');
        if (svgElement) {
            this.applyTransform(svgElement);
        }
    }
    
    togglePan() {
        this.panEnabled = !this.panEnabled;
        
        const panBtn = document.getElementById('toggle-pan');
        if (panBtn) {
            panBtn.style.backgroundColor = this.panEnabled ? '#ccc' : '';
        }
        
        const svgElement = this.outputDiv.querySelector('svg');
        if (svgElement) {
            svgElement.style.cursor = this.panEnabled ? 'grab' : 'default';
        }
    }
}