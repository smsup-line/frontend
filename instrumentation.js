/**
 * Next.js Instrumentation file
 * This file runs once when the server starts
 * Used to set up global error handlers and block external connections
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Import server error handler for server-side
    // This will block external connections and handle errors
    await import('./lib/server-error-handler.js');
  }
}

