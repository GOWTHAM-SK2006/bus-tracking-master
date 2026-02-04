const WebSocket = require('ws');
const http = require('http');

const WS_URL = 'ws://localhost:8080/ws/driver';
const API_URL = 'http://localhost:8080/api/driver/1'; // Just a test endpoint

console.log('--- Debugging Connection ---');

// Test HTTP
console.log(`Testing HTTP GET to ${API_URL}...`);
const req = http.get(API_URL, (res) => {
    console.log(`HTTP Status: ${res.statusCode}`);
    res.on('data', (d) => {
        console.log('HTTP Body Partial:', d.toString().substring(0, 100));
    });
});

req.on('error', (e) => {
    console.error(`HTTP Error: ${e.message}`);
});

// Test WebSocket
console.log(`Testing WebSocket to ${WS_URL}...`);
const ws = new WebSocket(WS_URL);

ws.on('open', () => {
    console.log('WebSocket Connected Successfully!');
    ws.close();
});

ws.on('error', (e) => {
    console.error(`WebSocket Error: ${e.message}`);
});
