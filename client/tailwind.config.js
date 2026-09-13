/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f5ff",
          100: "#dce6ff",
          200: "#b8ccff",
          300: "#8fadff",
          400: "#6089ff",
          500: "#3d63f5",
          600: "#2d4bd6",
          700: "#2339a8",
          800: "#1c2f82",
          900: "#182968",
        },
      },
    },
  },
  plugins: [],
};
