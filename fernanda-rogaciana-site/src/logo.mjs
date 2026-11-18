// Monograma "R" com balança da justiça, nas cores do cartão de visita.
// Recriação vetorial: substituir pelo arquivo original do logo quando disponível.

export function logoSvg({ tamanho = 96, cor = "#F2C9CF", fundo = "none" } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${tamanho}" height="${tamanho}" role="img" aria-label="Monograma R com balança da justiça">
  <rect width="120" height="120" rx="60" fill="${fundo}"/>
  <circle cx="60" cy="60" r="55" fill="none" stroke="${cor}" stroke-width="2"/>
  <circle cx="60" cy="60" r="50" fill="none" stroke="${cor}" stroke-width="0.8"/>
  <text x="56" y="84" text-anchor="middle" font-family="'Cormorant Garamond', Georgia, 'Times New Roman', serif" font-size="70" font-weight="600" fill="${cor}">R</text>
  <g fill="none" stroke="${cor}" stroke-width="1.6" stroke-linecap="round">
    <line x1="84" y1="30" x2="84" y2="62"/>
    <line x1="72" y1="35" x2="96" y2="35"/>
    <line x1="79" y1="62" x2="89" y2="62"/>
    <path d="M72 35 L67 47 M72 35 L77 47"/>
    <path d="M96 35 L91 47 M96 35 L101 47"/>
    <path d="M66 47 Q72 53 78 47 Z" fill="${cor}"/>
    <path d="M90 47 Q96 53 102 47 Z" fill="${cor}"/>
  </g>
  <circle cx="84" cy="29" r="1.8" fill="${cor}"/>
</svg>`;
}
