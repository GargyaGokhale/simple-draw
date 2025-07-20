export class Renderer {
    constructor() {
        this.outputDiv = document.getElementById('mermaidOutput');
        // Initialize Mermaid with safe configuration
        window.mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose', // Changed from 'strict' to support subgraphs
            logLevel: 'debug', // Enable detailed logging
            flowchart: { 
                htmlLabels: true, // Ensure flowchart diagrams render correctly
                subGraphTitleMargin: { top: 0, bottom: 0 } // Better subgraph rendering
            }
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
        this.isMobileView = window.innerWidth <= 768; // Check if in mobile view
        
        // Update isMobileView on resize
        window.addEventListener('resize', () => {
            this.isMobileView = window.innerWidth <= 768;
        });
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
            // Note: Mermaid will be initialized by ThemeManager, so we don't reinitialize here
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
            
            // Apply current theme to the newly rendered output
            if (window.app && window.app.themeManager) {
                window.app.themeManager.applyThemeToOutput();
            }
            
            console.log('Diagram rendered successfully');
            
            // After rendering, initialize pan and zoom
            this.addZoomControlsToDOM();
            this.setupZoomAndPan();
            
            // Add scroll indicator for mobile view
            if (this.isMobileView) {
                this.addScrollIndicator();
            }
        } catch (error) {
            console.error('Mermaid rendering error:', error);
            
            // Remove any Mermaid.js-generated div elements
            const errorDivs = document.querySelectorAll('div[id^="dmermaid-diagram"]');
            errorDivs.forEach((div) => div.remove());
            
            this.outputDiv.innerHTML = `<p style="color: red;">Error rendering diagram: ${error.message || 'Please check your syntax and try again.'}</p>`;
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
        
        // Create zoom in button with magnifying glass plus icon
        const zoomInBtn = document.createElement('button');
        zoomInBtn.innerHTML = '<i class="fas fa-search-plus"></i>';
        zoomInBtn.title = 'Zoom In';
        zoomInBtn.className = 'zoom-control-btn';
        zoomInBtn.addEventListener('click', () => this.zoomIn());
        
        // Create zoom out button with magnifying glass minus icon
        const zoomOutBtn = document.createElement('button');
        zoomOutBtn.innerHTML = '<i class="fas fa-search-minus"></i>';
        zoomOutBtn.title = 'Zoom Out';
        zoomOutBtn.className = 'zoom-control-btn';
        zoomOutBtn.addEventListener('click', () => this.zoomOut());
        
        // Create reset button
        const resetBtn = document.createElement('button');
        resetBtn.innerHTML = '<i class="fas fa-redo-alt"></i>';
        resetBtn.title = 'Reset Zoom';
        resetBtn.className = 'zoom-control-btn';
        resetBtn.addEventListener('click', () => this.resetZoom());
        
        // Create pan toggle button
        const panBtn = document.createElement('button');
        panBtn.innerHTML = '<i class="fas fa-hand-paper"></i>';
        panBtn.title = 'Toggle Pan';
        panBtn.id = 'toggle-pan';
        panBtn.className = 'zoom-control-btn';
        if (this.panEnabled) {
            panBtn.classList.add('active');
        }
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
            if (this.panEnabled) {
                panBtn.classList.add('active');
            } else {
                panBtn.classList.remove('active');
            }
        }
        
        const svgElement = this.outputDiv.querySelector('svg');
        if (svgElement) {
            svgElement.style.cursor = this.panEnabled ? 'grab' : 'default';
        }
    }

    addScrollIndicator() {
        // Remove any existing indicator
        const existingIndicator = document.querySelector('.scroll-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // Create scroll indicator
        const indicator = document.createElement('div');
        indicator.className = 'scroll-indicator';
        indicator.innerHTML = '<i class="fas fa-arrows-alt-v"></i>';
        
        // Append to output container
        this.outputDiv.appendChild(indicator);
        
        // Fade out after 5 seconds
        setTimeout(() => {
            indicator.classList.add('fade');
            // Remove from DOM after animation completes
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
            }, 1000);
        }, 5000);
    }

    // Method to re-render current diagram (useful for theme changes)
    reRender() {
        const currentContent = document.getElementById('mermaidInput').value;
        if (currentContent && currentContent.trim()) {
            this.renderDiagram(currentContent);
        }
    }
}