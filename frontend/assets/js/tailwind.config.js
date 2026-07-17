/* Tailwind CDN config — Cute Crew white & red tokens.
   Token names kept from the old theme so existing bg-*/text-* classes just re-colour:
   `gold` is now the brand RED, `ink` is white (used as text-on-red), text stays dark. */
tailwind.config = {
  theme: {
    extend: {
      colors: {
        ink: '#ffffff',        // page background / text-on-red
        surface: '#fdf1ef',    // soft blush section background
        card: '#ffffff',       // cards
        line: '#f0dcd9',       // light borders
        soft: '#8a807e',       // muted text
        gold: '#e8352b',       // BRAND RED (accent)
        golddim: '#c8271e',    // darker red (hover)
        peach: '#dd7d2e',      // amber (low-stock warning)
        babypink: '#f7a8c4',
        pastelblue: '#9cc6ff',
        mint: '#1f9d55',       // readable success green
        cream: '#3a3230'       // dark neutral text
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif']
      },
      boxShadow: {
        lux: '0 12px 40px -14px rgba(232,53,43,0.30)',
        glow: '0 0 30px rgba(232,53,43,0.18)'
      }
    }
  }
};
