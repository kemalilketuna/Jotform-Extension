/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx,html}',
    './src/entrypoints/**/*.{js,ts,jsx,tsx,html}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './public/**/*.html',
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      letterSpacing: {
        'tight-custom': '-0.176px',
      },
      colors: {
        'custom-blue': '#01105c',
      },
    },
  },
  plugins: [],
};
