export class ExportManager {
    constructor() {
        this.svgBtn = document.getElementById('exportSVG');
        this.pngBtn = document.getElementById('exportPNG');
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.svgBtn.addEventListener('click', () => this.exportSVG());
        this.pngBtn.addEventListener('click', () => this.exportPNG());
    }

    exportSVG() {
        try {
            const svg = document.querySelector('#mermaidOutput svg');
            if (!svg) {
                alert('No diagram to export! Please render a diagram first.');
                return;
            }
            const svgData = this.sanitizeSVG(new XMLSerializer().serializeToString(svg));
            if (!svgData) {
                alert('Invalid SVG content. Export aborted.');
                return;
            }
            const blob = new Blob([svgData], { type: 'image/svg+xml' });
            this.downloadFile(blob, 'diagram.svg');
        } catch (error) {
            console.error('Error exporting SVG:', error);
            alert('Error exporting SVG. Please try again.');
        }
    }

    exportPNG() {
        try {
            const svg = document.querySelector('#mermaidOutput svg');
            if (!svg) {
                alert('No diagram to export! Please render a diagram first.');
                return;
            }
            
            window.html2canvas(svg).then(canvas => {
                canvas.toBlob(blob => {
                    if (blob) {
                        this.downloadFile(blob, 'diagram.png');
                    } else {
                        alert('Failed to create PNG file. Please try again.');
                    }
                });
            }).catch(error => {
                console.error('Error exporting PNG:', error);
                alert('Error exporting PNG. Please try again.');
            });
        } catch (error) {
            console.error('Error exporting PNG:', error);
            alert('Error exporting PNG. Please try again.');
        }
    }

    downloadFile(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    sanitizeSVG(svgContent) {
        // Basic sanitization to remove potentially harmful elements
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgContent, 'image/svg+xml');
        const scripts = doc.querySelectorAll('script');
        scripts.forEach(script => script.remove());
        return new XMLSerializer().serializeToString(doc);
    }
}