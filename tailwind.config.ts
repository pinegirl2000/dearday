import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Hydrangea (보라수국) 테마
        hydrangea: {
          50: '#FAF5FF',
          100: '#E8D5F5',
          200: '#D5C5E8',
          300: '#C9A0DC',
          400: '#9B7FCB',
          500: '#7B5EA7',
          600: '#5A3D7A',
          700: '#3A2D4F'
        }
      },
      fontFamily: {
        serif: ['var(--font-noto-serif)', 'serif'],
        sans: ['var(--font-noto-sans)', 'sans-serif']
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out',
        'shimmer': 'shimmer 2s linear infinite'
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      }
    }
  },
  plugins: []
};
export default config;
