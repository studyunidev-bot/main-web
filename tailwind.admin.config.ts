import type { Config } from "tailwindcss";
import baseConfig from "./tailwind.config";

/** Admin / back-office Tailwind scan (style.css). */
const config: Config = {
  ...baseConfig,
  content: [
    "./src/app/admins/**/*.{js,jsx,tsx}",
    "./src/components/**/*.{js,jsx,tsx}",
    "./src/features/**/*.{js,jsx,tsx}",
    "./src/lib/**/*.{js,jsx,tsx}",
    "./src/utils/**/*.{js,jsx,tsx}",
    "./src/css/style.css",
  ],
};

export default config;
