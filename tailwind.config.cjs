/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          DEFAULT: '#00ffae',
          400: '#10f2c1',
          500: '#00ffae',
          600: '#00e5ff'
        },
        cyan: {
          DEFAULT: '#00e5ff'
        },
        primary: {
          DEFAULT: '#00ffae'
        },
        glass: 'rgba(8,12,10,0.42)'
      },
      boxShadow: {
        'neon': '0 6px 30px rgba(0,255,174,0.18), 0 2px 8px rgba(0,229,255,0.06)',
        'neon-strong': '0 0 60px rgba(0,255,174,0.18)'
      },
      backdropBlur: {
        '2xl': '22px'
      },
      borderRadius: {
        'xl-3': '24px',
        'xl-4': '30px'
      }
    }
  },
  plugins: []
}
