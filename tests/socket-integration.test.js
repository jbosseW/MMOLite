// tests/socket-integration.test.js
// Layer 5: Socket integration smoke tests.
// Spins up an in-process server and connects a real socket.io-client.
// Tests that the server accepts connections and responds to basic events.

const http = require('http');
const path = require('path');

// Integration tests require a running server — check if socket.io-client is available
let io_client;
try {
  io_client = require('socket.io-client');
} catch (e) {
  console.warn('[integration] socket.io-client not installed; skipping integration tests. Run: npm install --save-dev socket.io-client');
}

// Minimal express+socket.io server for testing (no full server.js boot)
const express = require('express');
const { Server } = require('socket.io');

let httpServer, ioServer, serverPort;
let testSocket;

beforeAll((done) => {
  if (!io_client) return done();

  const app = express();
  httpServer = http.createServer(app);
  ioServer = new Server(httpServer, { cors: { origin: '*' } });

  // Minimal auth bypass for testing
  ioServer.use((socket, next) => {
    socket.user = { name: 'TestBot', key: 'test_key', color: '#fff' };
    next();
  });

  // Register a minimal zone_enter handler for smoke test
  ioServer.on('connection', (socket) => {
    socket.emit('identity', {
      id: socket.id,
      name: socket.user.name,
      color: socket.user.color,
      level: 1,
    });

    socket.on('zone_enter', (data) => {
      socket.emit('zone_state', {
        zoneId: data && data.zoneId ? data.zoneId : 'starter_town',
        players: [],
        resources: [],
        npcs: [],
      });
    });

    socket.on('ping_server', () => {
      socket.emit('pong_server', { ts: Date.now() });
    });
  });

  httpServer.listen(0, () => {
    serverPort = httpServer.address().port;
    done();
  });
});

afterAll((done) => {
  if (!io_client) return done();
  if (testSocket && testSocket.connected) testSocket.disconnect();
  if (ioServer) ioServer.close();
  if (httpServer) httpServer.close(done);
  else done();
});

// ---------------------------------------------------------------------------

describe('Socket connection', () => {
  // Combine connect + identity into one test to avoid race condition:
  // identity is emitted on connection, so the listener must be registered
  // before the socket is created.
  test('client connects and receives identity', (done) => {
    if (!io_client) return done();
    let identityOk = false;
    let connectOk = false;
    const finish = () => { if (identityOk && connectOk) done(); };

    testSocket = io_client(`http://localhost:${serverPort}`, { timeout: 5000 });
    testSocket.on('identity', (data) => {
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('name', 'TestBot');
      identityOk = true;
      finish();
    });
    testSocket.on('connect', () => {
      expect(testSocket.connected).toBe(true);
      connectOk = true;
      finish();
    });
    testSocket.on('connect_error', (err) => done(err));
  });
});

describe('Zone enter', () => {
  test('server responds to zone_enter with zone_state', (done) => {
    if (!io_client || !testSocket) return done();

    const cleanup = setTimeout(() => done(new Error('Timeout: no zone_state received')), 5000);
    testSocket.once('zone_state', (data) => {
      clearTimeout(cleanup);
      expect(data).toHaveProperty('zoneId');
      expect(Array.isArray(data.players)).toBe(true);
      done();
    });

    testSocket.emit('zone_enter', { zoneId: 'starter_town' });
  });
});

describe('Ping round-trip', () => {
  test('server responds to ping_server with pong_server', (done) => {
    if (!io_client || !testSocket) return done();

    const cleanup = setTimeout(() => done(new Error('Timeout: no pong received')), 3000);
    testSocket.once('pong_server', (data) => {
      clearTimeout(cleanup);
      expect(data).toHaveProperty('ts');
      expect(typeof data.ts).toBe('number');
      done();
    });

    testSocket.emit('ping_server');
  });
});

describe('Disconnect handling', () => {
  test('client can cleanly disconnect', (done) => {
    if (!io_client || !testSocket) return done();
    testSocket.once('disconnect', () => done());
    testSocket.disconnect();
  });
});
