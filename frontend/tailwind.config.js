/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      /* ── Brand & Semantic Colors ── */
      colors: {
        solar: {
          orange: '#FF6B1A',
          'orange-lt': '#FF9A5C',
          'orange-dk': '#E85D0F',
        },
        electric: {
          blue: '#0A84FF',
          'sky': '#50B8FF',
          dark: '#0057B8',
        },
        midnight: '#0D1B2A',
        surface: {
          DEFAULT: '#132236',
          light: '#1E3550',
        },
        'slate-blue': '#4A7FA5',
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        'text-primary': '#E8F4FD',
        'text-secondary': '#8BA7C2',
        'text-muted': '#A0AEC0',
        'text-disabled': '#97979B',
        divider: '#1E3550',
      },

      /* ── Typography ── */
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display': ['48px', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.02em' }],
        'h1': ['32px', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.02em' }],
        'h2': ['24px', { lineHeight: '1.25', fontWeight: '600' }],
        'h3': ['18px', { lineHeight: '1.3', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'body': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'sm': ['12px', { lineHeight: '1.4', fontWeight: '400' }],
        'xs': ['10px', { lineHeight: '1.1', fontWeight: '500', letterSpacing: '0.05em' }],
        'mono-lg': ['16px', { lineHeight: '1.4', fontWeight: '500' }],
        'mono-sm': ['14px', { lineHeight: '1.4', fontWeight: '400' }],
        'data-hero': ['38px', { lineHeight: '0.95', fontWeight: '700', letterSpacing: '-0.6px' }],
        'score-xl': ['72px', { lineHeight: '1.0', fontWeight: '800', letterSpacing: '-2.88px' }],
      },

      /* ── Spacing (4pt grid) ── */
      spacing: {
        '0.5': '2px',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        'header': '64px',
        'sidebar': '240px',
        'sidebar-collapsed': '56px',
        'panel': '380px',
      },

      /* ── Border Radius ── */
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        'card': '20px',
        'badge': '26px',
        'pill': '40px',
        'cta': '50px',
        'full': '9999px',
      },

      /* ── Shadows ── */
      boxShadow: {
        'sm': '0 1px 3px rgba(0,0,0,0.3)',
        'md': '0 4px 12px rgba(0,0,0,0.4)',
        'lg': '0 8px 24px rgba(0,0,0,0.5)',
        'glow': '0 0 20px rgba(255,107,26,0.25)',
        'glow-strong': '0 0 30px rgba(255,107,26,0.4)',
        'deep': 'rgba(13,27,42,0) 0px 237px 66px, rgba(13,27,42,0.01) 0px 152px 61px, rgba(13,27,42,0.05) 0px 85px 51px, rgba(13,27,42,0.09) 0px 38px 38px, rgba(13,27,42,0.1) 0px 9px 21px',
        'card': 'rgba(0,0,0,0.01) 0px 63px 25px, rgba(0,0,0,0.05) 0px 35px 21px, rgba(0,0,0,0.09) 0px 16px 16px, rgba(0,0,0,0.1) 0px 4px 9px',
      },

      /* ── Z-Index ── */
      zIndex: {
        'base': '0',
        'raised': '10',
        'dropdown': '50',
        'sticky': '100',
        'modal-bg': '200',
        'modal': '210',
        'toast': '300',
      },

      /* ── Animation ── */
      transitionDuration: {
        'instant': '0ms',
        'fast': '100ms',
        'normal': '200ms',
        'slow': '350ms',
        'glacial': '600ms',
      },
      transitionTimingFunction: {
        'standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'enter': 'cubic-bezier(0.0, 0.0, 0.2, 1)',
        'exit': 'cubic-bezier(0.4, 0.0, 1, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'countUp': {
          'from': { opacity: '0', transform: 'translateY(8px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'slideIn': {
          'from': { transform: 'translateX(100%)', opacity: '0' },
          'to': { transform: 'translateX(0)', opacity: '1' },
        },
        'slideUp': {
          'from': { transform: 'translateY(16px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        'glow': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(255,107,26,0.4)' },
          '50%': { boxShadow: '0 0 24px rgba(255,107,26,0.8)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fadeIn': {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        'scaleIn': {
          'from': { transform: 'scale(0.9)', opacity: '0' },
          'to': { transform: 'scale(1)', opacity: '1' },
        },
        'arcWipe': {
          'from': { strokeDashoffset: '283' },
          'to': { strokeDashoffset: 'var(--arc-end)' },
        },
      },
      animation: {
        'count': 'countUp 0.5s ease-out',
        'slide-in': 'slideIn 0.35s cubic-bezier(0.4,0,0.2,1)',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.4,0,0.2,1)',
        'glow': 'glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite linear',
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        'arc': 'arcWipe 1.2s cubic-bezier(0.4,0,0.2,1) forwards',
      },
    },
  },
  plugins: [],
}
