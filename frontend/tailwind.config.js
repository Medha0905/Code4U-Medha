/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FFFDFB',
          100: '#FAF7F2',
          200: '#F3EEE5',
          300: '#E9E1D3',
        },
        ink: {
          900: '#2B2A28',
          700: '#4A4844',
          500: '#7A776F',
          300: '#B4B0A6',
        },
        indigo: {
          50: '#F2F0FC',
          100: '#E4E0F8',
          200: '#C9C1F1',
          300: '#A99DE8',
          400: '#8B7DE0',
          500: '#7264D6',
          600: '#5D4FC2',
          700: '#4A3EA0',
        },
        peach: {
          50: '#FFF4EC',
          100: '#FFE4D1',
          300: '#FFC49B',
          500: '#FF9E5E',
          600: '#F0813A',
        },
        sage: {
          50: '#EFF7F1',
          100: '#DBEEE0',
          300: '#A9D6B6',
          500: '#6FB884',
          600: '#4F9A66',
        },
        sky: {
          50: '#EEF5FC',
          100: '#D9EAFA',
          300: '#A6CDF0',
          500: '#6BA6E0',
          600: '#4A87C7',
        },
        amber: {
          50: '#FDF6E8',
          100: '#F9E8C2',
          300: '#EFC46B',
          500: '#DFA83E',
          600: '#C08A22',
        },
        rose: {
          50: '#FCEEEE',
          100: '#F8D9D9',
          300: '#EBA3A3',
          500: '#D96B6B',
          600: '#C24E4E',
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        soft: '0 2px 14px rgba(43, 42, 40, 0.06)',
        card: '0 4px 24px rgba(43, 42, 40, 0.08)',
        lift: '0 12px 32px rgba(93, 79, 194, 0.16)',
      },
      borderRadius: {
        xl2: '1.25rem',
        xl3: '1.75rem',
      },
      backgroundImage: {
        'ticket-notch': 'radial-gradient(circle at center, transparent 8px, white 8.5px)',
      },
    },
  },
  plugins: [],
};
