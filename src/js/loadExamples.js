// Function to fetch and render examples from examples.txt
async function loadExamples() {
    try {
        // Get base path for correct fetching on GitHub Pages
        const basePath = window.location.hostname === 'gargyagokhale.github.io' ? '/simple-draw/' : '/';
        const response = await fetch(`${basePath}examples.txt`);
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

        // Generate HTML for the snippets with markdown-style code formatting
        const html = `
            <h2>Mermaid Diagram Examples</h2>
            <div class="examples-container">
                ${snippets.map((snippet, index) => `
                    <div class="snippet">
                        <div class="snippet-header">
                            <h3>${snippet.title}</h3>
                        </div>
                        <div class="code-container">
                            <div class="code-header">
                                <span>mermaid</span>
                                <button class="copy-btn" aria-label="Copy code">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                            <pre class="code-block"><code class="example-code">${snippet.code}</code></pre>
                        </div>
                        <button class="use-btn">Use This Example</button>
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

// Make loadExamples available globally and as an export
window.loadExamples = loadExamples;

// Helper function to copy text to clipboard
function copyTextToClipboard(text) {
    return navigator.clipboard.writeText(text)
        .then(() => {
            // Show temporary success message
            return true;
        })
        .catch(err => {
            console.error('Failed to copy text: ', err);
            return false;
        });
}

// Add event delegation for copy buttons
document.addEventListener('click', async (e) => {
    // Handle copy button clicks
    if (e.target.closest('.copy-btn')) {
        const button = e.target.closest('.copy-btn');
        const codeBlock = button.closest('.code-container').querySelector('.example-code');
        
        if (codeBlock) {
            const originalText = button.innerHTML;
            const success = await copyTextToClipboard(codeBlock.textContent.trim());
            
            if (success) {
                // Change button text/icon temporarily
                button.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    button.innerHTML = originalText;
                }, 2000);
            }
        }
    }
    
    // Handle "Use This Example" button clicks
    if (e.target.classList.contains('use-btn')) {
        const codeBlock = e.target.closest('.snippet').querySelector('.example-code');
        if (codeBlock) {
            const codeText = codeBlock.textContent.trim();
            const textarea = document.getElementById('mermaidInput');
            
            if (textarea) {
                textarea.value = codeText;
                document.querySelector('.info-popup').classList.remove('active');
                
                // Trigger render
                const renderBtn = document.getElementById('renderBtn');
                if (renderBtn) {
                    renderBtn.click();
                }
            }
        }
    }
});

export { loadExamples };