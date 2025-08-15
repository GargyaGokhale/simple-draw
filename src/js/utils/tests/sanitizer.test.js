/**
 * Unit tests for the Sanitizer utility module.
 * Tests input validation, sanitization, and error handling.
 * 
 * @file sanitizer.test.js
 * @author Gargya Gokhale
 * @version 1.0.0
 */

import { 
    sanitizeInput, 
    sanitizeMermaidInput, 
    validateAndSanitizeInput 
} from '../sanitizer.js';

/**
 * Test suite for sanitizeInput function
 */
console.group('🧪 Testing sanitizeInput function');

// Test basic HTML escaping
try {
    const result = sanitizeInput('<script>alert("xss")</script>');
    const expected = '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;';
    console.assert(result === expected, 'Failed: Basic HTML escaping');
    console.log('✅ Basic HTML escaping test passed');
} catch (error) {
    console.error('❌ Basic HTML escaping test failed:', error);
}

// Test ampersand escaping
try {
    const result = sanitizeInput('User & Admin');
    const expected = 'User &amp; Admin';
    console.assert(result === expected, 'Failed: Ampersand escaping');
    console.log('✅ Ampersand escaping test passed');
} catch (error) {
    console.error('❌ Ampersand escaping test failed:', error);
}

// Test null input handling
try {
    sanitizeInput(null);
    console.error('❌ Null input test failed: Should have thrown error');
} catch (error) {
    console.log('✅ Null input test passed: Correctly threw error');
}

// Test non-string input handling
try {
    sanitizeInput(123);
    console.error('❌ Non-string input test failed: Should have thrown error');
} catch (error) {
    console.log('✅ Non-string input test passed: Correctly threw error');
}

console.groupEnd();

/**
 * Test suite for sanitizeMermaidInput function
 */
console.group('🧪 Testing sanitizeMermaidInput function');

// Test Mermaid-specific sanitization - preserves ampersands for proper parsing
try {
    const result = sanitizeMermaidInput('graph TD\n  A["User & Admin"] --> B');
    const expected = 'graph TD\n  A["User & Admin"] --> B';
    console.assert(result === expected, 'Failed: Mermaid sanitization');
    console.log('✅ Mermaid sanitization test passed');
} catch (error) {
    console.error('❌ Mermaid sanitization test failed:', error);
}

// Test the specific sequence diagram issue
try {
    const input = 'sequenceDiagram\n    participant Dev as MacBook\n    participant K8s as K3s Cluster\n    \n    K8s->>K8s: Pull image & create pods\n    Dev->>K8s: kubectl/dashboard access';
    const result = sanitizeMermaidInput(input);
    const expected = 'sequenceDiagram\n    participant Dev as MacBook\n    participant K8s as K3s Cluster\n    \n    K8s->>K8s: Pull image & create pods\n    Dev->>K8s: kubectl/dashboard access';
    console.assert(result === expected, `Failed: Sequence diagram with ampersand\nExpected: ${expected}\nGot: ${result}`);
    console.log('✅ Sequence diagram with ampersand test passed');
} catch (error) {
    console.error('❌ Sequence diagram with ampersand test failed:', error);
}

// Test sequence diagram with quotes (your specific use case)
try {
    const input = 'sequenceDiagram\n    participant U as "User Interface"\n    U->>A: "Send Request"\n    A->>D: "Query Data"';
    const result = sanitizeMermaidInput(input);
    const expected = 'sequenceDiagram\n    participant U as "User Interface"\n    U->>A: Send Request\n    A->>D: Query Data';
    console.assert(result === expected, `Failed: Sequence diagram with quotes\nExpected: ${expected}\nGot: ${result}`);
    console.log('✅ Sequence diagram with quotes test passed');
} catch (error) {
    console.error('❌ Sequence diagram with quotes test failed:', error);
}

console.groupEnd();

/**
 * Test suite for validateAndSanitizeInput function
 */
console.group('🧪 Testing validateAndSanitizeInput function');

// Test length validation
try {
    validateAndSanitizeInput('a'.repeat(10001));
    console.error('❌ Length validation test failed: Should have thrown error');
} catch (error) {
    console.log('✅ Length validation test passed: Correctly threw error');
}

// Test blacklist patterns
try {
    validateAndSanitizeInput('<script>alert("test")</script>', {
        blacklistPatterns: [/<script/i]
    });
    console.error('❌ Blacklist pattern test failed: Should have thrown error');
} catch (error) {
    console.log('✅ Blacklist pattern test passed: Correctly threw error');
}

// Test valid input
try {
    const result = validateAndSanitizeInput('Hello & World', { maxLength: 100 });
    const expected = 'Hello &amp; World';
    console.assert(result === expected, 'Failed: Valid input sanitization');
    console.log('✅ Valid input sanitization test passed');
} catch (error) {
    console.error('❌ Valid input sanitization test failed:', error);
}

console.groupEnd();

console.log('🏁 All sanitizer tests completed!');
