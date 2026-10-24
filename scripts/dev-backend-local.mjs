/** Local dev API (port 3001). Cross-platform substitute for PORT=3001 on Unix shells. */
process.env.PORT = process.env.PORT || '3001';
await import('../server/index.js');
