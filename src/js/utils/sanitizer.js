/**
 * Input sanitization utilities for the Simple Draw application.
 * Provides secure input processing to prevent XSS attacks and ensure safe content handling.
 * 
 * @module Sanitizer
 * @author Gargya Gokhale
 * @version 1.0.0
 * @since 2025-08-15
 */

/**
 * Sanitizes user input by escaping potentially dangerous HTML characters.
 * This function converts special characters that could be used for XSS attacks
 * into their HTML entity equivalents, making them safe for display.
 * 
 * @function sanitizeInput
 * @param {string} input - The raw input string to be sanitized
 * @returns {string} The sanitized string with HTML entities escaped
 * @throws {TypeError} If input is not a string
 * @throws {Error} If input is null or undefined
 * 
 * @example
 * // Basic usage
 * const safe = sanitizeInput('<script>alert("xss")</script>');
 * // Returns: '&lt;script&gt;alert("xss")&lt;/script&gt;'
 * 
 * @example
 * // With Mermaid diagram content
 * const diagram = sanitizeInput('graph TD\n  A["User & Admin"] --> B');
 * // Returns: 'graph TD\n  A["User &amp; Admin"] --&gt; B'
 * 
 * @see {@link https://owasp.org/www-community/xss-filter-evasion-cheatsheet|OWASP XSS Prevention}
 */
export function sanitizeInput(input) {
    // Validate input parameters
    if (input === null || input === undefined) {
        throw new Error('Input cannot be null or undefined');
    }
    
    if (typeof input !== 'string') {
        throw new TypeError(`Expected string input, received ${typeof input}`);
    }
    
    // Character mapping for HTML entity encoding
    const htmlEntityMap = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;'
    };
    
    // Replace dangerous characters with their HTML entity equivalents
    return input.replace(/[<>&"'/]/g, (char) => {
        return htmlEntityMap[char] || char;
    });
}

/**
 * Sanitizes input specifically for Mermaid diagram content.
 * This is a specialized version that preserves Mermaid syntax while
 * still protecting against XSS attacks.
 * 
 * @function sanitizeMermaidInput
 * @param {string} input - The raw Mermaid diagram code to be sanitized
 * @returns {string} The sanitized Mermaid code safe for rendering
 * @throws {TypeError} If input is not a string
 * @throws {Error} If input is null or undefined
 * 
 * @example
 * // Mermaid-specific sanitization
 * const diagram = sanitizeMermaidInput('graph TD\n  A[Start] --> B{Decision}');
 * // Preserves Mermaid syntax while escaping dangerous content
 * 
 * @see {@link https://mermaid.js.org/|Mermaid Documentation}
 */
export function sanitizeMermaidInput(input) {
    // Validate input parameters
    if (input === null || input === undefined) {
        throw new Error('Input cannot be null or undefined');
    }
    
    if (typeof input !== 'string') {
        throw new TypeError(`Expected string input, received ${typeof input}`);
    }
    
    // For Mermaid, we need to be more selective about what we escape
    // to preserve diagram syntax while still preventing XSS
    const mermaidSafeEntityMap = {
        '<': '&lt;',
        '&': '&amp;',
        '"': '&quot;'
    };
    
    return input.replace(/[<>&"]/g, (char) => {
        return mermaidSafeEntityMap[char] || char;
    });
}

/**
 * Validates and sanitizes input with additional security checks.
 * Performs comprehensive validation and sanitization including
 * length limits and pattern matching.
 * 
 * @function validateAndSanitizeInput
 * @param {string} input - The input to validate and sanitize
 * @param {Object} [options={}] - Configuration options
 * @param {number} [options.maxLength=10000] - Maximum allowed input length
 * @param {boolean} [options.allowEmpty=true] - Whether to allow empty strings
 * @param {RegExp[]} [options.blacklistPatterns=[]] - Patterns to reject
 * @returns {string} The validated and sanitized input
 * @throws {Error} If input fails validation
 * 
 * @example
 * // With length limit
 * const safe = validateAndSanitizeInput(userInput, { maxLength: 5000 });
 * 
 * @example
 * // With pattern blacklist
 * const safe = validateAndSanitizeInput(userInput, {
 *   blacklistPatterns: [/<script/i, /javascript:/i]
 * });
 */
export function validateAndSanitizeInput(input, options = {}) {
    const {
        maxLength = 10000,
        allowEmpty = true,
        blacklistPatterns = []
    } = options;
    
    // Validate input exists
    if (input === null || input === undefined) {
        throw new Error('Input cannot be null or undefined');
    }
    
    if (typeof input !== 'string') {
        throw new TypeError(`Expected string input, received ${typeof input}`);
    }
    
    // Check empty input
    if (!allowEmpty && input.trim() === '') {
        throw new Error('Empty input is not allowed');
    }
    
    // Check length limits
    if (input.length > maxLength) {
        throw new Error(`Input length ${input.length} exceeds maximum allowed length ${maxLength}`);
    }
    
    // Check against blacklist patterns
    for (const pattern of blacklistPatterns) {
        if (pattern.test(input)) {
            throw new Error(`Input contains prohibited pattern: ${pattern.source}`);
        }
    }
    
    // Sanitize the validated input
    return sanitizeInput(input);
}

/**
 * Default export object containing all sanitization functions.
 * Provides a convenient way to import all functions at once.
 * 
 * @namespace SanitizerUtils
 */
export default {
    sanitizeInput,
    sanitizeMermaidInput,
    validateAndSanitizeInput
};
