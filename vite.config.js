import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        profile: resolve(__dirname, 'profile.html'),
        survey: resolve(__dirname, 'survey.html'),
        approach: resolve(__dirname, 'approach.html')
      }
    }
  }
});
