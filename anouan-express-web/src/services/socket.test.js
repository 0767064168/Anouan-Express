import test from 'node:test';
import assert from 'node:assert/strict';
import { getSocketUrl } from './socket.js';

test('getSocketUrl uses the backend when the frontend runs on Vite dev ports', () => {
  assert.equal(getSocketUrl('http://localhost:3002'), 'http://localhost:5000');
  assert.equal(getSocketUrl('http://localhost:5173'), 'http://localhost:5000');
  assert.equal(getSocketUrl('http://localhost:5000'), 'http://localhost:5000');
  assert.equal(getSocketUrl('http://example.com'), 'http://example.com');
});
