/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#11131b",
        surface: "#11131b",
        "surface-container": "#1d1f27",
        "surface-container-high": "#282a32",
        "surface-container-highest": "#33343d",
        primary: {
          DEFAULT: "#c3c0ff",
          container: "#4f46e5",
        },
        secondary: {
          DEFAULT: "#4edea3",
          container: "#00a572",
        },
        error: {
          DEFAULT: "#ffb4ab",
          container: "#93000a",
        },
        warning: {
          DEFAULT: "#ffd0a6",
          container: "#b35900",
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      }
    },
  },
  plugins: [],
}
