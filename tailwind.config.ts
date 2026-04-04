import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0d1b2a",
        ocean: "#1b4965",
        sand: "#f5f1e8",
        gold: "#c69b3b",
        mint: "#d7f4ea",
        coral: "#ffddd2"
      },
      fontFamily: {
        sans: [
          "var(--font-inter)"
        ]
      },
      boxShadow: {
        panel: "0 18px 48px rgba(13, 27, 42, 0.08)"
      },
      backgroundImage: {
        mesh: "radial-gradient(circle at top left, rgba(198,155,59,0.18), transparent 32%), radial-gradient(circle at 90% 10%, rgba(27,73,101,0.12), transparent 28%), linear-gradient(180deg, #f8f5ef 0%, #ffffff 100%)"
      }
    }
  },
  plugins: []
};

export default config;
