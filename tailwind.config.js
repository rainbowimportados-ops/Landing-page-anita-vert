/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primitivas — a paleta crua. Componentes não devem usar direto.
        forest: {
          50: '#F1F6F2',
          100: '#DDEBE1',
          200: '#BBD7C4',
          300: '#8FBBA0',
          400: '#5E9878',
          500: '#3B7A5B',
          600: '#2A6148',
          700: '#1F4C39',
          800: '#163A2C',
          900: '#0E2820',
        },

        // Semânticas — o que os componentes usam. Definidas em src/index.css.
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
        // Já nasce translúcida; não recebe modificador de opacidade.
        'borda-inversa': 'rgb(var(--cor-borda-inversa))',
      },

      // Escala tipográfica fluida: um passo por nível, sem valores soltos.
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.5' }],
        sm: ['0.875rem', { lineHeight: '1.6' }],
        base: ['1rem', { lineHeight: '1.65' }],
        lg: ['1.125rem', { lineHeight: '1.6' }],
        xl: ['1.25rem', { lineHeight: '1.45' }],
        '2xl': ['1.5rem', { lineHeight: '1.3' }],
        'display-sm': ['clamp(1.75rem, 1.35rem + 1.9vw, 2.5rem)', { lineHeight: '1.15' }],
        'display-md': ['clamp(2.25rem, 1.6rem + 3vw, 3.5rem)', { lineHeight: '1.1' }],
        'display-lg': ['clamp(2.75rem, 1.8rem + 4.2vw, 4.25rem)', { lineHeight: '1.05' }],
      },

      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },

      // Elevação: três degraus, para não haver sombra improvisada.
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
        content: '72rem',
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
    // `hover-fino:` aplica o estilo apenas onde existe um ponteiro de verdade.
    // No toque o hover fica "grudado" depois do tap, então esses efeitos não
    // devem valer ali (§2 hover-vs-tap).
    ({ addVariant }) => {
      addVariant('hover-fino', '@media (hover: hover) and (pointer: fine)')
    },
  ],
}
