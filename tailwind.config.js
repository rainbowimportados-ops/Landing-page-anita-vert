/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#F7F3EC',
          100: '#EFE7DC',
          200: '#E3D4C3',
          300: '#C3AD91',
          400: '#AA8565',
          500: '#8B5B40',
          600: '#6E432D',
          700: '#4F3325',
          800: '#2B1B14',
          900: '#1E120E',
        },
        fundo: 'rgb(var(--cor-fundo) / <alpha-value>)',
        superficie: 'rgb(var(--cor-superficie) / <alpha-value>)',
        'superficie-suave': 'rgb(var(--cor-superficie-suave) / <alpha-value>)',
        'superficie-inversa': 'rgb(var(--cor-superficie-inversa) / <alpha-value>)',
        'superficie-inversa-suave': 'rgb(var(--cor-superficie-inversa-suave) / <alpha-value>)',
        'superficie-rodape': 'rgb(var(--cor-superficie-rodape) / <alpha-value>)',
        conteudo: 'rgb(var(--cor-conteudo) / <alpha-value>)',
        'conteudo-suave': 'rgb(var(--cor-conteudo-suave) / <alpha-value>)',
        'conteudo-tenue': 'rgb(var(--cor-conteudo-tenue) / <alpha-value>)',
        'conteudo-inverso': 'rgb(var(--cor-conteudo-inverso) / <alpha-value>)',
        'conteudo-inverso-suave': 'rgb(var(--cor-conteudo-inverso-suave) / <alpha-value>)',
        'conteudo-inverso-tenue': 'rgb(var(--cor-conteudo-inverso-tenue) / <alpha-value>)',
        marca: 'rgb(var(--cor-marca) / <alpha-value>)',
        'marca-forte': 'rgb(var(--cor-marca-forte) / <alpha-value>)',
        'marca-tenue': 'rgb(var(--cor-marca-tenue) / <alpha-value>)',
        realce: 'rgb(var(--cor-realce) / <alpha-value>)',
        'realce-escuro': 'rgb(var(--cor-realce-escuro) / <alpha-value>)',
        borda: 'rgb(var(--cor-borda) / <alpha-value>)',
        'borda-forte': 'rgb(var(--cor-borda-forte) / <alpha-value>)',
        'borda-inversa': 'rgb(var(--cor-borda-inversa))',
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.5' }],
        sm: ['0.875rem', { lineHeight: '1.6' }],
        base: ['1rem', { lineHeight: '1.65' }],
        lg: ['1.125rem', { lineHeight: '1.6' }],
        xl: ['1.25rem', { lineHeight: '1.45' }],
        '2xl': ['1.5rem', { lineHeight: '1.3' }],
        'display-sm': ['clamp(1.9rem, 1.35rem + 2.1vw, 3rem)', { lineHeight: '1.08' }],
        'display-md': ['clamp(2.35rem, 1.6rem + 3.2vw, 4rem)', { lineHeight: '1.04' }],
        'display-lg': ['clamp(2.85rem, 1.8rem + 4.6vw, 5.1rem)', { lineHeight: '1.02' }],
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Montserrat', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        1: 'var(--sombra-1)',
        2: 'var(--sombra-2)',
        3: 'var(--sombra-3)',
      },
      borderRadius: {
        card: '1rem',
        painel: '1.5rem',
      },
      maxWidth: {
        content: '80rem',
        texto: '38rem',
      },
      transitionTimingFunction: {
        saida: 'var(--curva-saida)',
      },
      transitionDuration: {
        rapido: 'var(--tempo-rapido)',
        padrao: 'var(--tempo-padrao)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translate3d(0, 14px, 0)' },
          to: { opacity: '1', transform: 'translate3d(0, 0, 0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up var(--tempo-entrada) var(--curva-saida) both',
      },
    },
  },
  plugins: [
    ({ addVariant }) => {
      addVariant('hover-fino', '@media (hover: hover) and (pointer: fine)')
    },
  ],
}
