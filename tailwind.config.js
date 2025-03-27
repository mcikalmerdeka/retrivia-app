/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        vintage: {
          primary: '#d4a373',
          secondary: '#ccd5ae',
          accent: '#e9edc9',
          background: '#fefae0',
          text: '#5e503f',
          border: '#ccd5ae',
          sepia: '#8B4513',
          paper: '#F9F5E7'
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-in-out',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flash': 'flash 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        flash: {
          '0%': { opacity: '1' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
      fontFamily: {
        'vintage': ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

