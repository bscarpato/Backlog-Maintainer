import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./renderer/index.html", "./renderer/src/**/*.{ts,tsx}"],
  theme: {
    extend: {}
  },
  plugins: []
};

export default config;
