import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves the project under /mcp-caply/.
  base: '/mcp-caply/',
});
