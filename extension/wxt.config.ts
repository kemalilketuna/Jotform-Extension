import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons'],
  imports: {
    eslintrc: {
      enabled: true,
    },
  },
  manifest: {
    name: 'AI-Form',
    description:
      'AI-powered browser extension that automates form filling and interactions with JotForm using intelligent agents.',
    action: {
      default_title: 'AI-Form - Smart Form Assistant',
    },
    permissions: ['tabs', 'activeTab', 'scripting'],
    content_security_policy: {
      extension_pages:
        "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';",
    },
    web_accessible_resources: [
      {
        resources: ['sounds/radioSelect.mp3', 'sounds/keystrokeSoft.mp3'],
        matches: ['<all_urls>'],
      },
    ],
  },
  webExt: {
    disabled: true,
  },
  autoIcons: {
    baseIconPath: '../public/jotformLogo.svg',
    developmentIndicator: false,
  },
  dev: {
    server: {
      port: 3000,
    },
  },
});
