import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        muted: "#667085",
        paper: "#f8fafc",
        brand: "#4f46e5",
      },
    },
  },
  plugins: [],
};

export default config;
