// Workaround for Vercel build issues with Vite
import { spawn } from 'child_process';

console.log('Starting Vite build process...');

// Run vite build directly from node_modules
const buildProcess = spawn('./node_modules/.bin/vite', ['build'], { 
  stdio: 'inherit',
  shell: true
});

buildProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`Vite build process exited with code ${code}`);
    process.exit(code);
  } else {
    console.log('Vite build completed successfully');
  }
}); 