/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8FAFC',
        surface: '#FFFFFF',
        primary: '#6366F1', // Indigo suave
        success: '#10B981', // Verde esmeralda tenue
        textMain: '#334155', // Slate 700
        textSecondary: '#64748B', // Slate 500
      },
      boxShadow: {
        'soft': '0 2px 4px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.04)',
      }
    },
  },
  plugins: [],
}
