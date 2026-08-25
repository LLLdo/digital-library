import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17211b",
        paper: "#f7f7f3",
        forest: "#176b4d",
        mint: "#e8f2ed",
      },
      boxShadow: {
        soft: "0 12px 35px rgba(23,33,27,.08)",
      },
    },
  },
  plugins: [],
};
export default config;
