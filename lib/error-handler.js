/**
 * Global error handler for uncaught exceptions
 * Prevents application crashes from connection timeouts
 */

if (typeof process !== 'undefined') {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    // Check if it's a connection timeout error
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error('=== UNCAUGHT CONNECTION ERROR ===');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Address:', error.address);
      console.error('Port:', error.port);
      console.error('This error has been caught and will not crash the application.');
      
      // Log the error but don't crash
      // In production, you might want to send this to an error tracking service
      return;
    }
    
    // For other uncaught exceptions, log and potentially exit
    console.error('=== UNCAUGHT EXCEPTION ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    
    // In production, you might want to gracefully shutdown
    // For now, we'll just log it
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    // Check if it's a connection timeout error
    if (reason && (reason.code === 'ETIMEDOUT' || reason.code === 'ECONNREFUSED' || reason.code === 'ENOTFOUND')) {
      console.error('=== UNHANDLED REJECTION (CONNECTION ERROR) ===');
      console.error('Error code:', reason.code);
      console.error('Error message:', reason.message);
      console.error('This error has been caught and will not crash the application.');
      return;
    }
    
    console.error('=== UNHANDLED REJECTION ===');
    console.error('Reason:', reason);
    console.error('Promise:', promise);
  });
}

