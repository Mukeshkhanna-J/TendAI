/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: "#12325a",
          blue: "#1d4f8f",
          saffron: "#d97706",
          green: "#0f766e",
          line: "#d7dde8",
          paper: "#f7f9fc"
        }
      },
      boxShadow: {
        panel: "0 8px 24px rgba(18, 50, 90, 0.08)"
      }
    }
  },
  plugins: []
};
