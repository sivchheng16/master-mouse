module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        rotate12: {
          '0%': { transform: 'rotate(12deg)' },
          '100%': { transform: 'rotate(372deg)' }, // 12 + 360 = 372
        },
      },
      animation: {
        'rotate-12-loop': 'rotate12 2s linear infinite',
      },
    },
  },
  plugins: [],
}   