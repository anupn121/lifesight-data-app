import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
      borderRadius: {
        ds: "var(--radius)",
        "ds-sm": "var(--radius-sm)",
        "ds-md": "var(--radius-md)",
        "ds-lg": "var(--radius-lg)",
        "ds-xl": "var(--radius-xl)",
      },
      keyframes: {
        "toast-in": {
          "0%": { opacity: "0", transform: "translate(-50%, 16px)" },
          "100%": { opacity: "1", transform: "translate(-50%, 0)" },
        },
      },
      animation: {
        "toast-in": "toast-in 0.3s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
