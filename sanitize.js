// Security: HTML Sanitization and XSS Prevention Utilities

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} - Escaped HTML-safe string
 */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Create a safe DOM element with text content
 * @param {string} tag - HTML tag name
 * @param {string} text - Text content (will be escaped)
 * @param {object} attributes - Key-value pairs for attributes
 * @param {string} className - CSS class names
 * @returns {HTMLElement} - Safe DOM element
 */
function createSafeElement(tag, text = '', attributes = {}, className = '') {
  const el = document.createElement(tag);
  
  // Set text content (automatically escaped)
  if (text) {
    el.textContent = text;
  }
  
  // Set attributes safely
  Object.entries(attributes).forEach(([key, val]) => {
    if (key === 'data-id' || key === 'id' || key === 'class') {
      el.setAttribute(key, String(val));
    }
  });
  
  // Set class name
  if (className) {
    el.className = className;
  }
  
  return el;
}

/**
 * Safely insert HTML that contains only text and basic structure
 * Removes script tags and event handlers
 * @param {string} htmlString - HTML to sanitize
 * @returns {string} - Sanitized HTML
 */
function sanitizeHtml(htmlString) {
  // Create a temporary container
  const temp = document.createElement('div');
  temp.textContent = htmlString;
  
  // Return the escaped version
  return temp.innerHTML;
}

/**
 * Validate JSON response from fetch
 * @param {Response} response - Fetch response object
 * @returns {Promise<object>} - Validated JSON
 */
async function validateJsonResponse(response) {
  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
  }
  
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('Invalid response: Expected application/json');
  }
  
  try {
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error('Invalid JSON in response');
  }
}

/**
 * Safe fetch wrapper with validation
 * @param {string} url - URL to fetch
 * @param {object} options - Fetch options
 * @returns {Promise<object>} - Validated JSON response
 */
async function secureFetch(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      // Add security headers if not already present
      headers: {
        'Accept': 'application/json',
        ...options.headers
      }
    });
    
    return await validateJsonResponse(response);
  } catch (error) {
    console.error('Secure fetch error:', error);
    throw error;
  }
}

/**
 * Remove dangerous attributes from HTML strings
 * @param {string} htmlString - HTML string to clean
 * @returns {string} - Cleaned HTML
 */
function removeDangerousAttributes(htmlString) {
  // Remove event handlers
  let cleaned = htmlString.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  cleaned = cleaned.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove script tags
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  return cleaned;
}

/**
 * Truncate text safely (for display purposes)
 * @param {string} text - Text to truncate
 * @param {number} length - Max length
 * @returns {string} - Truncated text
 */
function truncateText(text, length = 100) {
  if (!text) return '';
  const str = String(text);
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}
