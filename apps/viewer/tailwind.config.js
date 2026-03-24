/** @type {import("@types/tailwindcss/tailwind-config").TailwindConfig } */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        code: ['Recursive', 'monospace'],
      },
      colors: {
        ember: '#9b3a2a',
        sea: '#0d4d67',
        mist: '#edf3f6',
        ink: '#112430',
        gold: '#f1b94c',
      },
      boxShadow: {
        panel: '0 18px 45px rgba(17, 36, 48, 0.12)',
      },
    },
  },
  plugins: [],
};
