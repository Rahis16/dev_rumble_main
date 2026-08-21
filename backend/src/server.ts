import http from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';
import { setupWebSocketServer } from './websocket/geminiLiveProxy.js';
import dns from "node:dns";

const PORT = process.env.PORT || 5000;

// 2. Network / System configurations
dns.setServers(["8.8.8.8", "8.8.4.4"]);

async function startServer() {
  // Connect to Database
  await connectDB();

  // Create HTTP Server
  const server = http.createServer(app);

  // Bind WebSocket server to HTTP Upgrade events
  setupWebSocketServer(server);

  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` MalangCode AI Manager Server is running on port ${PORT} `);
    console.log(` REST endpoints: http://localhost:${PORT}/api        `);
    console.log(` WebSocket feed: ws://localhost:${PORT}/api/live     `);
    console.log(`====================================================`);
  });
}

startServer().catch(err => {
  console.error('Fatal error starting MalangCode server:', err);
  process.exit(1);
});
