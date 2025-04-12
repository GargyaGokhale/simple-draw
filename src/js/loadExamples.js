// Function to fetch and render examples from examples.txt
async function loadExamples() {
    try {
        const response = await fetch('examples.txt');
        const text = await response.text();
        console.log('Fetched examples.txt content');

        // Parse the examples.txt content
        const snippets = [];
        const regex = /## (.+?)\n```mermaid\n([\s\S]+?)```/g;
        let match;
        console.log('Parsing examples...');
        
        while ((match = regex.exec(text)) !== null) {
            console.log('Found snippet:', match[1]);
            snippets.push({ title: match[1], code: match[2] });
        }

        // Generate HTML for the snippets - now only for the popup
        const html = `
            <h2>Mermaid Diagram Examples</h2>
            <div class="examples-container">
                ${snippets.map((snippet, index) => `
                    <div class="snippet">
                        <h3>${snippet.title}</h3>
                        <pre><code class="example-code">${snippet.code}</code></pre>
                        <button class="copy-btn">Copy</button>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Remove any standalone examples container to avoid duplication
        const standaloneExamples = document.getElementById('examples');
        if (standaloneExamples) {
            standaloneExamples.innerHTML = ''; // Clear it instead of removing to maintain layout
        }
        
        return html;
    } catch (error) {
        console.error('Error loading examples:', error);
        return '<p>Error loading examples. Please try again.</p>';
    }
}

// Function no longer needed as we handle copying in the Editor class
function copyToClipboard(button) {
    // Keeping for backward compatibility, but not using
    const code = button.previousElementSibling.textContent;
    navigator.clipboard.writeText(code).then(() => {
        alert('Code copied to clipboard!');
    });
}

// Make loadExamples available globally and as an export
window.loadExamples = loadExamples;
export { loadExamples };