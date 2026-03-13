/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#10231c",
        moss: "#355c4f",
        sand: "#e7dcc6",
        linen: "#f8f3ea",
        coral: "#d96f4a",
        mint: "#d5eadf",
      },
      boxShadow: {
        soft: "0 18px 45px rgba(16, 35, 28, 0.12)",
      },
      fontFamily: {
        sans: ["'DM Sans'", "sans-serif"],
        display: ["'Fraunces'", "serif"],
      },
    },
  },
  plugins: [],
};
