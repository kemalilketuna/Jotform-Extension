import { defineConfig } from 'wxt';
import { config } from 'dotenv';

// Load environment variables
config();

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
    permissions: ['tabs', 'activeTab', 'scripting', 'storage'],
    host_permissions: ['<all_urls>'],
    content_security_policy: {
      extension_pages:
        "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';",
    },
    web_accessible_resources: [
      {
        resources: [
          'sounds/radioSelect.mp3',
          'sounds/keystrokeSoft.mp3',
          'podoLogo.png',
          'fonts/inter-regular.woff2',
          'fonts/inter-medium.woff2',
          'fonts/inter-semibold.woff2',
        ],
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
