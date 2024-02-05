/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.jsx', './src/**/*.js', './public/**/*.html'],
  theme: {
    extend: {
      animation: {
        slide: 'slide 10s linear infinite',
      },
      backgroundImage: {
        'fade-black-gray': 'linear-gradient(to bottom, #000 0%, #454545 10%, #454545 90%, #000 100%)',
      },
      colors: {
        cybergreen: '#34FF00',
        cybergold: '#FFB800',
        cyberyellow: '#FCF200',
        lightgreen: '#E5FFDF',
        lightgray: '#E7E7E7',
        mediumgray: '#B5B5B5',
        darkgray: '#242424',
      },
      fontFamily: {
        'power': ['Power', 'sans-serif'],
        'blocky': ['Blocky', 'sans-serif'],
        'amcap': ['Amcap', 'sans-serif'],
        'courier': ['Courier', 'Courier New', 'monospace'],
      },
      fontSize: {
        'xxs': '0.6rem',
        'xxxs': '0.45rem',
      },
      textShadow: {
        'cybergreen': '0 0 20px #34FF00',
        'black': '0 0 20px #000000',
      },
      textIndent: {
        'reverse': '-2em',
      },
      width: {
        '128': '32rem',
      }
    },
  },
  plugins: [
    require('tailwindcss-textshadow')
  ],
}

