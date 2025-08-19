import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons'],
  manifest: {
    name: 'AI-Form',
    description: 'AI-powered browser extension that automates form filling and interactions with JotForm using intelligent agents.',
    action: {
      default_title: 'AI-Form - Smart Form Assistant',
    },
    permissions: [
      'tabs',
      'activeTab',
      'scripting',
      'webNavigation'
    ],
    content_security_policy: {
      extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';"
    }
  },
  webExt: {
    disabled: true,
  },
  autoIcons: {
    baseIconPath: '../public/jotform-logo.svg',
    developmentIndicator: false,
  },
  dev: {
    server: {
      port: 3000
    }
  }
});
