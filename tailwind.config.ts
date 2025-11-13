import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        base: '#DEDBD2', // Beige claro/Gris (Sustituto de Blanco)
        secondary: '#F7E1D7', // Melocotón pálido (Cards/Modals)
        accent: '#B0C4B1', // Verde Salvia (Botones/Links)
        'text-dark': '#4A5759', // Grafito (Texto principal)
        danger: '#EDAFB8', // Rosa (Error/Destacado)
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};

export default config;
