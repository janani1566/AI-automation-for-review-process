import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=======================================================');
console.log('🌟 Launching AI-Powered Intern Review Automation System');
console.log('=======================================================');

// Start backend server
const server = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
});

server.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
});
