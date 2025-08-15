import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons'],
  webExt: {
    disabled: true,
  },
  autoIcons: {
    baseIconPath: '../public/jotform-logo.svg',
    grayscaleOnDevelopment: false,
  },
});
