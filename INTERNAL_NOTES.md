# Internal Documentation

## Setup Instructions

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Local development server (optional, but recommended)

### Development Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/simple-draw.git
   cd simple-draw
   ```

2. Running the Application:
   - Option 1: Direct browser opening
     - Simply open index.html in your web browser
   
   - Option 2: Using a local server (recommended)
     - Using Python:
       ```bash
       python -m http.server 8000
       ```
     - Using Node.js (with http-server):
       ```bash
       npm install -g http-server
       http-server
       ```
     - Access the application at http://localhost:8000

### Development Workflow
1. Make changes to source files
2. Refresh browser to see updates
3. Test all features after changes:
   - Diagram rendering
   - SVG/PNG export
   - Responsive layout

## Module Overview

### App (app.js)
- Main application entry point
- Initializes Editor, Renderer, and ExportManager components
- Sets up initial example diagram with subgraph demonstration
- Handles DOM content loaded event

### Editor (editor.js)
- Manages the textarea input interface
- Methods:
  - `setupEventListeners()`: Sets up render button click event
  - `getDiagramContent()`: Retrieves current diagram code
  - `setContent(content)`: Updates textarea content
- Dispatches 'diagram-update' custom event

### Renderer (renderer.js)
- Handles diagram rendering using Mermaid.js
- **Subgraph Support**: Configured with `securityLevel: 'loose'` for subgraph rendering
- Methods:
  - `setupEventListeners()`: Listens for diagram-update events
  - `renderDiagram(content)`: Renders Mermaid code including subgraphs to SVG
  - `getCurrentSVG()`: Returns current rendered SVG
- Includes error handling for invalid diagram code and subgraph syntax

### ExportManager (exportManager.js)
- Manages diagram export functionality
- Methods:
  - `setupEventListeners()`: Sets up export button events
  - `exportSVG()`: Handles SVG export
  - `exportPNG()`: Converts SVG to PNG and exports
  - `downloadFile(blob, fileName)`: Triggers file download
- Supports both SVG and PNG export formats

## Event Flow
1. User enters Mermaid code in textarea
2. Render button click triggers diagram-update event
3. Renderer processes the code and updates preview
4. Export buttons allow downloading the rendered diagram

## Styling (styles.css)
- Responsive layout using flexbox
- Mobile-friendly breakpoints at 768px
- Consistent color scheme and spacing
- Clean, modern UI with subtle shadows