
/**
 * Network debugging utilities for development
 * Helps identify which network requests are failing
 */

// Only run in development
const isDev = __DEV__;

// Store original fetch
let originalFetch: typeof fetch | null = null;

/**
 * Wrap fetch to log all network requests in development
 * This helps identify which request is causing "Network request failed" errors
 */
export function setupNetworkDebugging() {
  if (!isDev) return;

  // Only setup once
  if (originalFetch) return;

  try {
    // Store original fetch
    originalFetch = global.fetch;

    // Wrap fetch with logging
    global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method || 'GET';

      // Log the request (but don't spam the console)
      if (isDev && url && !url.includes('/_expo/')) {
        console.log(`[Network Debug] ${method} ${url}`);
      }

      try {
        const response = await originalFetch!(input, init);
        return response;
      } catch (error: any) {
        // Log failed requests with details
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('❌ NETWORK REQUEST FAILED');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('URL:', url);
        console.log('Method:', method);
        console.log('Error:', error?.message || 'Unknown error');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Re-throw the error so it can be handled by the caller
        throw error;
      }
    };

    console.log('[Network Debug] Fetch wrapper installed');
  } catch (error) {
    console.log('[Network Debug] Failed to setup network debugging:', error);
  }
}

/**
 * Remove the fetch wrapper (cleanup)
 */
export function teardownNetworkDebugging() {
  if (!isDev) return;

  try {
    if (originalFetch) {
      global.fetch = originalFetch;
      originalFetch = null;
      console.log('[Network Debug] Fetch wrapper removed');
    }
  } catch (error) {
    console.log('[Network Debug] Failed to teardown network debugging:', error);
  }
}

/**
 * Check if a URL is safe to call (not blocked by ATS, etc.)
 */
export function isUrlSafe(url: string): boolean {
  if (!url) return false;

  try {
    const urlObj = new URL(url);

    // Check for http:// (not https://) which may be blocked by ATS on iOS
    if (urlObj.protocol === 'http:' && !urlObj.hostname.includes('localhost')) {
      console.log('[Network Debug] Warning: HTTP URL detected (may be blocked by ATS):', url);
      return false;
    }

    return true;
  } catch (error) {
    console.log('[Network Debug] Invalid URL:', url);
    return false;
  }
}

/**
 * Safe fetch wrapper that validates URLs and handles errors gracefully
 */
export async function safeFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: {
    timeout?: number;
    retries?: number;
    fallbackValue?: any;
  }
): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

  // Validate URL
  if (!isUrlSafe(url)) {
    throw new Error(`Unsafe URL: ${url}`);
  }

  // Setup timeout
  const timeout = options?.timeout || 10000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);

    // Handle timeout
    if (error.name === 'AbortError') {
      console.log('[Network Debug] Request timeout:', url);
      throw new Error(`Request timeout: ${url}`);
    }

    // Handle network errors
    if (error.message === 'Network request failed') {
      console.log('[Network Debug] Network request failed:', url);

      // Retry if configured
      if (options?.retries && options.retries > 0) {
        console.log('[Network Debug] Retrying request...');
        return safeFetch(input, init, {
          ...options,
          retries: options.retries - 1,
        });
      }
    }

    throw error;
  }
}
