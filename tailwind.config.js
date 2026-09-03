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
        fundo: 'var(--cor-fundo)',
        superficie: 'var(--cor-superficie)',
        'superficie-suave': 'var(--cor-superficie-suave)',
        'superficie-inversa': 'var(--cor-superficie-inversa)',
        'superficie-inversa-suave': 'var(--cor-superficie-inversa-suave)',
        'superficie-rodape': 'var(--cor-superficie-rodape)',

        conteudo: 'var(--cor-conteudo)',
        'conteudo-suave': 'var(--cor-conteudo-suave)',
        'conteudo-tenue': 'var(--cor-conteudo-tenue)',
        'conteudo-inverso': 'var(--cor-conteudo-inverso)',
        'conteudo-inverso-suave': 'var(--cor-conteudo-inverso-suave)',
        'conteudo-inverso-tenue': 'var(--cor-conteudo-inverso-tenue)',

        marca: 'var(--cor-marca)',
        'marca-forte': 'var(--cor-marca-forte)',
        'marca-tenue': 'var(--cor-marca-tenue)',
        realce: 'var(--cor-realce)',
        'realce-escuro': 'var(--cor-realce-escuro)',

        borda: 'var(--cor-borda)',
        'borda-forte': 'var(--cor-borda-forte)',
        'borda-inversa': 'var(--cor-borda-inversa)',
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
