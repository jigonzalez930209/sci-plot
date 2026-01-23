/**
 * @fileoverview Greek letters and mathematical symbols for LaTeX rendering
 * @module plugins/latex/symbols
 */

/**
 * Greek letters mapping (lowercase)
 */
export const GREEK_LOWERCASE: Record<string, string> = {
  alpha: 'α',
  beta: 'β',
  gamma: 'γ',
  delta: 'δ',
  epsilon: 'ε',
  zeta: 'ζ',
  eta: 'η',
  theta: 'θ',
  iota: 'ι',
  kappa: 'κ',
  lambda: 'λ',
  mu: 'μ',
  nu: 'ν',
  xi: 'ξ',
  omicron: 'ο',
  pi: 'π',
  rho: 'ρ',
  sigma: 'σ',
  tau: 'τ',
  upsilon: 'υ',
  phi: 'φ',
  chi: 'χ',
  psi: 'ψ',
  omega: 'ω',
};

/**
 * Greek letters mapping (uppercase)
 */
export const GREEK_UPPERCASE: Record<string, string> = {
  Alpha: 'Α',
  Beta: 'Β',
  Gamma: 'Γ',
  Delta: 'Δ',
  Epsilon: 'Ε',
  Zeta: 'Ζ',
  Eta: 'Η',
  Theta: 'Θ',
  Iota: 'Ι',
  Kappa: 'Κ',
  Lambda: 'Λ',
  Mu: 'Μ',
  Nu: 'Ν',
  Xi: 'Ξ',
  Omicron: 'Ο',
  Pi: 'Π',
  Rho: 'Ρ',
  Sigma: 'Σ',
  Tau: 'Τ',
  Upsilon: 'Υ',
  Phi: 'Φ',
  Chi: 'Χ',
  Psi: 'Ψ',
  Omega: 'Ω',
};

/**
 * Mathematical operators
 */
export const MATH_OPERATORS: Record<string, string> = {
  sum: '∑',
  prod: '∏',
  int: '∫',
  oint: '∮',
  partial: '∂',
  nabla: '∇',
  infty: '∞',
  hbar: 'ℏ',
  pm: '±',
  mp: '∓',
  times: '×',
  div: '÷',
  cdot: '·',
  ast: '∗',
  star: '⋆',
  circ: '∘',
  bullet: '•',
  cap: '∩',
  cup: '∪',
  vee: '∨',
  wedge: '∧',
  oplus: '⊕',
  otimes: '⊗',
  equiv: '≡',
  cong: '≅',
  approx: '≈',
  propto: '∝',
  neq: '≠',
  leq: '≤',
  geq: '≥',
  ll: '≪',
  gg: '≫',
  subset: '⊂',
  supset: '⊃',
  subseteq: '⊆',
  supseteq: '⊇',
  in: '∈',
  notin: '∉',
  ni: '∋',
  forall: '∀',
  exists: '∃',
  emptyset: '∅',
  neg: '¬',
  angle: '∠',
  perp: '⊥',
  parallel: '∥',
  rightarrow: '→',
  leftarrow: '←',
  leftrightarrow: '↔',
  Rightarrow: '⇒',
  Leftarrow: '⇐',
  Leftrightarrow: '⇔',
  mapsto: '↦',
  to: '→',
  langle: '⟨',
  rangle: '⟩',
  rightleftharpoons: '⇌',
  log: 'log',
  ln: 'ln',
  sin: 'sin',
  cos: 'cos',
  tan: 'tan',
};

/**
 * All symbols combined
 */
export const ALL_SYMBOLS: Record<string, string> = {
  ...GREEK_LOWERCASE,
  ...GREEK_UPPERCASE,
  ...MATH_OPERATORS,
};

/**
 * Get Unicode symbol for a LaTeX command
 */
export function getSymbol(command: string): string | undefined {
  return ALL_SYMBOLS[command];
}

/**
 * Check if a command is a known symbol
 */
export function isSymbol(command: string): boolean {
  return command in ALL_SYMBOLS;
}
