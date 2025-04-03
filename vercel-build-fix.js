// Workaround for Vercel build issues with Vite
import { spawn } from 'child_process';

console.log('Starting Vite build process...');

// Set environment variable to disable native extensions in rollup
process.env.ROLLUP_SKIP_NODEJS_NATIVE = 'true';

// Run vite build directly from node_modules
const buildProcess = spawn('./node_modules/.bin/vite', ['build'], { 
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    ROLLUP_SKIP_NODEJS_NATIVE: 'true',
    ROLLUP_NATIVE_DISABLE: 'true'
  }
});

buildProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`Vite build process exited with code ${code}`);
    process.exit(code);
  } else {
    console.log('Vite build completed successfully');
  }
}); 