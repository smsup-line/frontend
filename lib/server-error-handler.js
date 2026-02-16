/**
 * Server-side error handler
 * Prevents application crashes from various errors and blocks unwanted external connections
 */

if (typeof process !== 'undefined' && process.env.NEXT_RUNTIME === 'nodejs') {
  // Blocked IPs and domains - Add all malicious IPs found
  const BLOCKED_IPS = [
    '205.185.127.97',  // Crypto mining pool
    '66.96.20.147',    // Crypto mining pool
    '87.121.84.24',    // Malicious server
    '176.65.132.224',  // Malicious server
  ];
  const BLOCKED_DOMAINS = ['telemetry', 'analytics', 'webmail.eicat.ca', 'auto.c3pool.org', 'c3pool', 'supportxmr.com', 'monero', 'xmr', 'pool'];
  
  // Block malicious commands
  const BLOCKED_COMMANDS = ['base64', 'sh', 'bash', 'curl', 'wget', 'nc', 'netcat', 'pkill', 'kill', 'mining', 'monero', 'xmr'];
  
  // Create mock process object to prevent TypeError
  function createMockProcess() {
    const mockStream = {
      on: () => mockStream,
      pipe: () => mockStream,
      write: () => {},
      end: () => {},
      destroy: () => {},
    };
    
    return {
      kill: () => {},
      on: () => {},
      once: () => {},
      emit: () => {},
      stdout: mockStream,
      stderr: mockStream,
      stdin: mockStream,
      pid: 0,
      exitCode: null,
      spawnargs: [],
      spawnfile: '',
    };
  }
  
  // Original fetch function (if exists)
  const originalFetch = global.fetch;
  
  // Override fetch to block external connections
  if (typeof global.fetch === 'function') {
    global.fetch = function(url, options = {}) {
      const urlString = typeof url === 'string' ? url : url.toString();
      
      // Block telemetry and analytics URLs
      if (BLOCKED_DOMAINS.some(domain => urlString.includes(domain))) {
        console.warn(`[BLOCKED] Fetch blocked: ${urlString} (contains blocked domain)`);
        return Promise.reject(new Error('Connection blocked: telemetry/analytics'));
      }
      
      // Block specific IPs
      if (BLOCKED_IPS.some(ip => urlString.includes(ip))) {
        console.warn(`[BLOCKED] Fetch blocked: ${urlString} (contains blocked IP)`);
        return Promise.reject(new Error('Connection blocked: blocked IP address'));
      }
      
      // Block external HTTP URLs (except localhost)
      try {
        const urlObj = new URL(urlString);
        if (urlObj.protocol === 'http:' && !urlObj.hostname.includes('localhost') && !urlObj.hostname.includes('127.0.0.1')) {
          console.warn(`[BLOCKED] Fetch blocked: ${urlString} (external HTTP connection)`);
          return Promise.reject(new Error('Connection blocked: external HTTP connection'));
        }
      } catch (e) {
        // If URL parsing fails, continue with original fetch
      }
      
      // Use original fetch for allowed connections
      return originalFetch.call(this, url, options);
    };
  }
  
  // Block at net module level (lowest level) - PREVENT CONNECTION BEFORE IT HAPPENS
  try {
    const net = require('net');
    const originalCreateConnection = net.createConnection;
    
    net.createConnection = function(options, callback) {
      const hostname = typeof options === 'object' ? (options.host || options.hostname) : options;
      const port = typeof options === 'object' ? options.port : (arguments[1] || 80);
      
      // Block specific IPs BEFORE attempting connection - STRICT CHECK
      const hostStr = hostname ? String(hostname) : '';
      const isBlocked = hostStr && BLOCKED_IPS.some(ip => {
        return hostStr === ip || hostStr.includes(ip) || hostStr.startsWith(ip) || hostStr.endsWith(ip);
      });
      
      if (isBlocked) {
        // Only log once per minute per IP to reduce log spam
        const logKey = `${hostname}:${port}`;
        const now = Date.now();
        if (!global.blockedConnectionsLog) {
          global.blockedConnectionsLog = {};
        }
        if (!global.blockedConnectionsLog[logKey] || (now - global.blockedConnectionsLog[logKey]) > 60000) {
          console.warn(`[BLOCKED] net.createConnection PREVENTED: ${hostname}:${port} (blocked IP - connection prevented at net level)`);
          global.blockedConnectionsLog[logKey] = now;
        }
        
        const error = new Error('Connection blocked: blocked IP address');
        error.code = 'ECONNREFUSED';
        error.address = hostname;
        error.port = port;
        error.syscall = 'connect';
        
        // Create mock socket using EventEmitter
        const EventEmitter = require('events');
        class MockSocket extends EventEmitter {
          constructor() {
            super();
            this.destroyed = false;
            this.connecting = false;
            this.readyState = 'closed';
          }
          connect() {
            setImmediate(() => {
              this.emit('error', error);
              if (callback) callback(error);
            });
            return this;
          }
          end() { return this; }
          write() { return false; }
          destroy() { this.destroyed = true; return this; }
        }
        
        const mockSocket = new MockSocket();
        setImmediate(() => {
          mockSocket.emit('error', error);
          if (callback) callback(error);
        });
        
        return mockSocket;
      }
      
      return originalCreateConnection.call(this, options, callback);
    };
    
    console.log('[Server Error Handler] net.createConnection blocked for malicious IPs');
  } catch (e) {
    console.warn('[Server Error Handler] Failed to block net.createConnection:', e.message);
  }
  
  // Block at DNS level - prevent DNS resolution to blocked IPs
  try {
    const dns = require('dns');
    const originalLookup = dns.lookup;
    
    dns.lookup = function(hostname, options, callback) {
      // Block if hostname resolves to blocked IP
      const cb = typeof options === 'function' ? options : callback;
      const opts = typeof options === 'function' ? {} : options;
      
      // Check if hostname contains blocked IP
      if (hostname && BLOCKED_IPS.some(ip => hostname.includes(ip) || hostname === ip)) {
        console.warn(`[BLOCKED] DNS lookup blocked: ${hostname} (blocked IP)`);
        const error = new Error('DNS lookup blocked: blocked IP address');
        error.code = 'ENOTFOUND';
        if (cb) setImmediate(() => cb(error, null));
        return;
      }
      
      // Call original lookup
      if (typeof options === 'function') {
        return originalLookup.call(this, hostname, options);
      } else {
        return originalLookup.call(this, hostname, options, callback);
      }
    };
    
    console.log('[Server Error Handler] DNS lookup blocked for malicious IPs');
  } catch (e) {
    console.warn('[Server Error Handler] Failed to block DNS lookup:', e.message);
  }
  
  // Override http.request and https.request
  const http = require('http');
  const https = require('https');
  
  const originalHttpRequest = http.request;
  const originalHttpsRequest = https.request;
  
  http.request = function(options, callback) {
    const hostname = typeof options === 'string' ? options : (options.hostname || options.host);
    
    // Block specific IPs
    if (BLOCKED_IPS.some(ip => hostname && hostname.includes(ip))) {
      console.warn(`[BLOCKED] HTTP request blocked: ${hostname} (blocked IP)`);
      const error = new Error('Connection blocked: blocked IP address');
      error.code = 'ECONNREFUSED';
      if (callback) callback(error);
      return {
        on: () => {},
        end: () => {},
        write: () => {},
        abort: () => {},
      };
    }
    
      // Block telemetry domains and crypto mining pools
      if (hostname && BLOCKED_DOMAINS.some(domain => hostname.includes(domain))) {
        console.warn(`[BLOCKED] HTTP request blocked: ${hostname} (blocked domain)`);
        const error = new Error('Connection blocked: telemetry/analytics/mining pool');
        error.code = 'ECONNREFUSED';
        if (callback) callback(error);
        return {
          on: () => {},
          end: () => {},
          write: () => {},
          abort: () => {},
        };
      }
    
    return originalHttpRequest.call(this, options, callback);
  };
  
  https.request = function(options, callback) {
    const hostname = typeof options === 'string' ? options : (options.hostname || options.host);
    
    // Block specific IPs
    if (BLOCKED_IPS.some(ip => hostname && hostname.includes(ip))) {
      console.warn(`[BLOCKED] HTTPS request blocked: ${hostname} (blocked IP)`);
      const error = new Error('Connection blocked: blocked IP address');
      error.code = 'ECONNREFUSED';
      if (callback) callback(error);
      return {
        on: () => {},
        end: () => {},
        write: () => {},
        abort: () => {},
      };
    }
    
      // Block telemetry domains and crypto mining pools
      if (hostname && BLOCKED_DOMAINS.some(domain => hostname.includes(domain))) {
        console.warn(`[BLOCKED] HTTPS request blocked: ${hostname} (blocked domain)`);
        const error = new Error('Connection blocked: telemetry/analytics/mining pool');
        error.code = 'ECONNREFUSED';
        if (callback) callback(error);
        return {
          on: () => {},
          end: () => {},
          write: () => {},
          abort: () => {},
        };
      }
    
    return originalHttpsRequest.call(this, options, callback);
  };
  
  // Use setUncaughtExceptionCaptureCallback to catch ALL uncaught exceptions FIRST
  // This runs BEFORE any other uncaughtException handlers
  if (typeof process.setUncaughtExceptionCaptureCallback === 'function') {
    process.setUncaughtExceptionCaptureCallback((error) => {
      // Fast path for blocked IPs - prevent connection attempts
      if (error.code === 'ETIMEDOUT' && error.address) {
        if (BLOCKED_IPS.some(ip => error.address.includes(ip))) {
          console.warn(`[BLOCKED & CAPTURED] ETIMEDOUT to blocked IP: ${error.address}:${error.port || 80} - Connection prevented`);
          return; // Prevent process crash - don't rethrow
        }
      }
      
      // Fast path for other common errors
      if (error.code === 'EACCES' || error.code === 'ECONNREFUSED' || error.code === 'EPIPE') {
        console.warn(`[CAPTURED] ${error.code} error:`, error.message);
        return; // Prevent process crash
      }
      
      // For other errors, let it pass through to other handlers
      // But we still prevent crash by not rethrowing
      if (error.code === 'ETIMEDOUT') {
        console.warn(`[CAPTURED] ETIMEDOUT error:`, error.message);
        return; // Prevent process crash
      }
    });
    console.log('[Server Error Handler] setUncaughtExceptionCaptureCallback registered');
  }
  
  // Use setUncaughtExceptionCaptureCallback to catch ALL uncaught exceptions FIRST
  // This runs BEFORE any other uncaughtException handlers (including Next.js default handler)
  // BUT: Check if callback is already set (Next.js might have set it already)
  if (typeof process.setUncaughtExceptionCaptureCallback === 'function') {
    try {
      // Try to set callback - will throw if already set
      process.setUncaughtExceptionCaptureCallback((error) => {
      // Fast path for blocked IPs - prevent connection attempts
      if (error.code === 'ETIMEDOUT' && error.address) {
        const addressStr = String(error.address);
        const isBlocked = BLOCKED_IPS.some(ip => {
          return addressStr === ip || addressStr.includes(ip) || addressStr.startsWith(ip) || addressStr.endsWith(ip);
        });
        
        if (isBlocked) {
          // Only log once per minute to reduce log spam
          const now = Date.now();
          if (!global.lastBlockedIPLog || (now - global.lastBlockedIPLog) > 60000) {
            console.warn(`[BLOCKED & CAPTURED] ETIMEDOUT to blocked IP: ${error.address}:${error.port || 80} - Connection prevented (suppressing repeated logs)`);
            global.lastBlockedIPLog = now;
          }
          return; // Prevent process crash - don't rethrow
        }
      }
        
        // Fast path for other common errors
        if (error.code === 'EACCES' || error.code === 'ECONNREFUSED' || error.code === 'EPIPE') {
          console.warn(`[CAPTURED] ${error.code} error:`, error.message);
          return; // Prevent process crash
        }
        
        // For other ETIMEDOUT errors, still prevent crash
        if (error.code === 'ETIMEDOUT') {
          console.warn(`[CAPTURED] ETIMEDOUT error:`, error.message);
          return; // Prevent process crash
        }
        
        // For other errors, let it pass through but still prevent crash
        console.warn(`[CAPTURED] Uncaught exception:`, error.name, error.code, error.message);
        return; // Prevent process crash
      });
      console.log('[Server Error Handler] setUncaughtExceptionCaptureCallback registered (FIRST PRIORITY)');
    } catch (e) {
      // Callback already set by Next.js or another module
      console.warn('[Server Error Handler] setUncaughtExceptionCaptureCallback already set, using process.on instead');
    }
  }
  
  // Handle uncaught exceptions - MUST be synchronous and prevent process exit
  process.on('uncaughtException', (error) => {
    // Ignore EACCES errors (permission denied) - usually from /lrt file access
    if (error.code === 'EACCES') {
      console.warn('[IGNORED] EACCES error (permission denied):', error.message);
      return;
    }
    
    // Ignore ETIMEDOUT errors - network timeout errors (especially for blocked IPs)
    if (error.code === 'ETIMEDOUT') {
      // Check if it's a blocked IP
      if (error.address && (BLOCKED_IPS.some(ip => error.address.includes(ip) || error.address === ip) || error.address === '205.185.127.97')) {
        console.warn(`[BLOCKED & IGNORED] ETIMEDOUT to blocked IP: ${error.address}:${error.port || 80}`);
        return; // Prevent process crash
      }
      console.warn('[IGNORED] ETIMEDOUT error (connection timeout):', error.message);
      if (error.address) {
        console.warn('  Address:', error.address, 'Port:', error.port);
      }
      return; // Prevent process crash
    }
    
    // Ignore ReferenceError - undefined variable errors
    if (error.name === 'ReferenceError') {
      const errorMessage = error.message || '';
      if (errorMessage.includes('returnNaN') || errorMessage.includes('is not defined')) {
        console.warn('[IGNORED] ReferenceError:', error.message);
        return;
      }
    }
    
    // Ignore ECONNREFUSED errors
    if (error.code === 'ECONNREFUSED') {
      console.warn('[IGNORED] ECONNREFUSED error (connection refused):', error.message);
      return;
    }
    
    // Ignore EPIPE errors (broken pipe)
    if (error.code === 'EPIPE') {
      console.warn('[IGNORED] EPIPE error (broken pipe):', error.message);
      return;
    }
    
    // For other uncaught exceptions, log but don't crash
    // IMPORTANT: Don't let process exit - this prevents the application from crashing
    console.error('=== UNCAUGHT EXCEPTION ===');
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    if (error.stack) {
      // Limit stack trace to prevent log spam
      const stackLines = error.stack.split('\n');
      console.error('Stack:', stackLines.slice(0, 5).join('\n'));
    }
    // Don't exit - let the application continue running
    // process.exit() is NOT called here intentionally
  });
  
  // Remove default uncaughtException handler and re-register to ensure our handler is first
  // This ensures our handler catches errors before Next.js default handler
  const originalUncaughtException = process.listeners('uncaughtException');
  process.removeAllListeners('uncaughtException');
  
  // Re-register our handler first
  process.on('uncaughtException', (error) => {
    // Fast path for common errors
    if (error.code === 'ETIMEDOUT') {
      if (error.address && BLOCKED_IPS.some(ip => error.address.includes(ip))) {
        console.warn(`[BLOCKED & IGNORED] ETIMEDOUT to blocked IP: ${error.address}:${error.port || 80}`);
        return; // Prevent process crash
      }
      console.warn('[IGNORED] ETIMEDOUT error:', error.message);
      return;
    }
    if (error.code === 'EACCES' || error.code === 'ECONNREFUSED' || error.code === 'EPIPE') {
      console.warn(`[IGNORED] ${error.code} error:`, error.message);
      return;
    }
    if (error.name === 'ReferenceError') {
      const errorMessage = error.message || '';
      if (errorMessage.includes('returnNaN') || errorMessage.includes('is not defined')) {
        console.warn('[IGNORED] ReferenceError:', error.message);
        return;
      }
    }
    // For other errors, log but don't crash
    console.error('[UNCAUGHT EXCEPTION]', error.name, error.code, error.message);
  });
  
  // Re-register other handlers if they exist
  originalUncaughtException.forEach(listener => {
    if (listener.toString().indexOf('BLOCKED') === -1) {
      process.on('uncaughtException', listener);
    }
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    // Ignore connection errors
    if (reason && typeof reason === 'object') {
      if (reason.code === 'ETIMEDOUT' || reason.code === 'ECONNREFUSED' || reason.code === 'EACCES' || reason.code === 'EPIPE') {
        console.warn('[IGNORED] Unhandled rejection (connection error):', reason.code, reason.message);
        return;
      }
      
      // Ignore blocked connection errors
      if (reason.message && reason.message.includes('Connection blocked')) {
        console.warn('[IGNORED] Unhandled rejection (blocked connection):', reason.message);
        return;
      }
    }
    
    // Ignore ReferenceError
    if (reason && reason.name === 'ReferenceError') {
      const errorMessage = reason.message || '';
      if (errorMessage.includes('returnNaN') || errorMessage.includes('is not defined')) {
        console.warn('[IGNORED] Unhandled rejection (ReferenceError):', reason.message);
        return;
      }
    }
    
    // Log other unhandled rejections
    console.error('=== UNHANDLED REJECTION ===');
    console.error('Reason:', reason);
  });
  
  // Block child_process.exec, spawn, and fork
  try {
    const childProcess = require('child_process');
    
    const originalExec = childProcess.exec;
    const originalSpawn = childProcess.spawn;
    const originalFork = childProcess.fork;
    const originalExecFile = childProcess.execFile;
    
    // Block exec
    childProcess.exec = function(command, options, callback) {
      const cmd = typeof command === 'string' ? command : command.toString();
      
      // Block /bin/sh, bash, and other malicious commands
      if (cmd.includes('/bin/sh') || cmd.includes('bash') || 
          BLOCKED_COMMANDS.some(cmdBlocked => cmd.includes(cmdBlocked))) {
        console.error(`[BLOCKED] exec command blocked: ${cmd.substring(0, 100)}`);
        const error = new Error('Command execution blocked: malicious command detected');
        if (callback) callback(error, null, null);
        return createMockProcess();
      }
      
      // Block base64 decode specifically
      if (cmd.includes('base64') && (cmd.includes('decode') || cmd.includes('-d'))) {
        console.error(`[BLOCKED] base64 decode blocked: ${cmd.substring(0, 100)}`);
        const error = new Error('Command execution blocked: base64 decode');
        if (callback) callback(error, null, null);
        return createMockProcess();
      }
      
      return originalExec.call(this, command, options, callback);
    };
    
    // Block spawn
    childProcess.spawn = function(command, args, options) {
      const cmd = typeof command === 'string' ? command : command.toString();
      const allArgs = Array.isArray(args) ? args.join(' ') : '';
      const fullCmd = `${cmd} ${allArgs}`;
      
      // Block /bin/sh, bash, and other malicious commands
      if (cmd.includes('/bin/sh') || cmd.includes('bash') || 
          BLOCKED_COMMANDS.some(cmdBlocked => fullCmd.includes(cmdBlocked))) {
        console.error(`[BLOCKED] spawn command blocked: ${fullCmd.substring(0, 100)}`);
        // Return mock process object with all required properties
        return createMockProcess();
      }
      
      return originalSpawn.call(this, command, args, options);
    };
    
    // Block fork
    childProcess.fork = function(modulePath, args, options) {
      const modulePathStr = typeof modulePath === 'string' ? modulePath : modulePath.toString();
      
      // Block if contains malicious keywords
      if (BLOCKED_COMMANDS.some(cmdBlocked => modulePathStr.includes(cmdBlocked)) ||
          modulePathStr.includes('mining') || modulePathStr.includes('monero') || modulePathStr.includes('xmr')) {
        console.error(`[BLOCKED] fork blocked: ${modulePathStr}`);
        return createMockProcess();
      }
      
      return originalFork.call(this, modulePath, args, options);
    };
    
    // Block execFile
    childProcess.execFile = function(file, args, options, callback) {
      const fileStr = typeof file === 'string' ? file : file.toString();
      const allArgs = Array.isArray(args) ? args.join(' ') : '';
      const fullCmd = `${fileStr} ${allArgs}`;
      
      // Block /bin/sh, bash, and other malicious commands
      if (fileStr.includes('/bin/sh') || fileStr.includes('bash') ||
          BLOCKED_COMMANDS.some(cmdBlocked => fullCmd.includes(cmdBlocked))) {
        console.error(`[BLOCKED] execFile blocked: ${fullCmd.substring(0, 100)}`);
        const error = new Error('Command execution blocked: malicious file execution');
        if (callback) callback(error, null, null);
        return createMockProcess();
      }
      
      return originalExecFile.call(this, file, args, options, callback);
    };
    
    console.log('[Server Error Handler] Child process commands blocked');
  } catch (e) {
    console.warn('[Server Error Handler] Failed to block child_process:', e.message);
  }
  
  // Block system() calls if possible
  try {
    const vm = require('vm');
    const originalRunInContext = vm.runInContext;
    vm.runInContext = function(code, context, options) {
      const codeStr = typeof code === 'string' ? code : code.toString();
      
      // Block base64 decode and malicious code
      if (codeStr.includes('base64') || BLOCKED_COMMANDS.some(cmd => codeStr.includes(cmd))) {
        console.error(`[BLOCKED] VM execution blocked: ${codeStr.substring(0, 100)}`);
        throw new Error('VM execution blocked: malicious code detected');
      }
      
      return originalRunInContext.call(this, code, context, options);
    };
    
    console.log('[Server Error Handler] VM execution blocked for malicious code');
  } catch (e) {
    console.warn('[Server Error Handler] Failed to block VM:', e.message);
  }
  
  console.log('[Server Error Handler] Initialized - External connections blocked, errors handled, commands blocked');
}

