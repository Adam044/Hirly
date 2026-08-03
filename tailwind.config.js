/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.html",
    "./public/js/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#667eea',
          dark: '#5a67d8',
          light: '#a78bfa',
          'extra-light': '#f3f4ff',
        },
        secondary: {
          DEFAULT: '#4fd1c7',
          dark: '#38b2ac',
          light: '#81e6d9',
        },
        accent: {
          DEFAULT: '#f093fb',
          secondary: '#f6ad55',
          light: '#fef5e7',
        },
        text: {
          dark: '#1a202c',
          body: '#4a5568',
          light: '#a0aec0',
          muted: '#e2e8f0',
        },
        background: {
          light: '#fafbfc',
          card: '#ffffff',
          dark: '#1a202c',
          hover: '#f7fafc',
        },
        success: '#48bb78',
        warning: '#ed8936',
        danger: '#f56565',
        info: '#4299e1',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'xs': '0 1px 2px rgba(15, 23, 42, 0.02)',
        'sm': '0 1px 3px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.03)',
        'md': '0 4px 6px rgba(15, 23, 42, 0.04), 0 2px 4px rgba(15, 23, 42, 0.03)',
        'lg': '0 10px 15px rgba(15, 23, 42, 0.03), 0 4px 6px rgba(15, 23, 42, 0.02)',
        'xl': '0 20px 25px rgba(15, 23, 42, 0.03), 0 8px 10px rgba(15, 23, 42, 0.02)',
        '2xl': '0 25px 50px rgba(15, 23, 42, 0.04)',
        'primary': '0 10px 20px rgba(102, 126, 234, 0.15)',
        'secondary': '0 10px 20px rgba(79, 209, 199, 0.15)',
        'accent': '0 10px 20px rgba(240, 147, 251, 0.15)',
      },
    },
  },
  plugins: [],
}