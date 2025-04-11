# Simple Draw

A web-based diagram creation tool that leverages the Mermaid.js library to create and export diagrams easily.

## Features

- Real-time diagram rendering
- Export diagrams as SVG or PNG
- User-friendly interface with split-view layout
- Responsive design for both desktop and mobile
- Built-in error handling
- Example diagram template included

## Getting Started

1. Clone the repository
2. Open index.html in a modern web browser
3. Start creating diagrams using Mermaid syntax

## Usage

1. Enter your Mermaid diagram code in the left panel
2. Click "Render" to see the result in the right panel
3. Use the export buttons to download your diagram as SVG or PNG

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- Mermaid.js for diagram rendering

## Dependencies

- [Mermaid.js](https://mermaid.js.org/) (v10.6.1) - Diagram rendering
- [html2canvas](https://html2canvas.hertzen.com/) (v1.4.1) - PNG export functionality

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/simple-draw.git
cd simple-draw
```

2. Install dependencies:
```bash
npm init -y
npm install mermaid@10.6.1 html2canvas@1.4.1
```

3. Link dependencies in your HTML:
Add these lines to your index.html before the closing </body> tag:
```html
<script src="node_modules/mermaid/dist/mermaid.min.js"></script>
<script src="node_modules/html2canvas/dist/html2canvas.min.js"></script>

