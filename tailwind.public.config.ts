import type { Config } from "tailwindcss";
import baseConfig from "./tailwind.config";

/**
 * Public-site Tailwind scan only — keeps admin-only utilities out of public.css
 * (reduces render-blocking unused CSS on marketing pages).
 */
const config: Config = {
  ...baseConfig,
  content: [
    "./src/app/gatpat/**/*.{js,jsx,tsx}",
    "./src/app/[lang]/**/*.{js,jsx,tsx}",
    "./src/app/auth/**/*.{js,jsx,tsx}",
    "./src/components/site/**/*.{js,jsx,tsx}",
    "./src/components/shop/**/*.{js,jsx,tsx}",
    "./src/components/logo.tsx",
    "./src/features/**/*.{js,jsx,tsx}",
    "./src/lib/**/*.{js,jsx,tsx}",
    "./src/utils/**/*.{js,jsx,tsx}",
    "./src/css/public.css",
  ],
  theme: {
    ...baseConfig.theme,
    extend: {
      ...baseConfig.theme?.extend,
      colors: {
        ...(baseConfig.theme?.extend?.colors as Record<string, unknown>),
        gold: { light: "#f5d17a", DEFAULT: "#d4a017", dark: "#b8860b" },
        "red-expo": "#ff4d4d",
      },
    },
  },
};

export default config;
