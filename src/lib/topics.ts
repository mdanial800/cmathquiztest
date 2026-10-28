export type TopicId = 'vectors' | 'matrices' | 'limits' | 'differentiation'

export interface Subskill {
  id: string
  name: string
}

export interface Topic {
  id: TopicId
  name: string
  tagline: string
  /** Why this matters in Computing — shown to motivate learners. */
  whyItMatters: string
  /** Tailwind classes driven by the per-topic theme variables. */
  color: { text: string; bg: string; soft: string; border: string }
  symbol: string
  subskills: Subskill[]
  /** Key ideas shown on the briefing card before a round. LaTeX in $...$. */
  keyIdeas: string[]
}

export const TOPICS: Topic[] = [
  {
    id: 'vectors',
    name: 'Vectors',
    tagline: 'Direction, magnitude and the geometry of data',
    whyItMatters:
      'Game physics, 3D graphics, and machine-learning embeddings all run on vector arithmetic.',
    color: {
      text: 'text-topic-vectors',
      bg: 'bg-topic-vectors',
      soft: 'bg-topic-vectors/10',
      border: 'border-topic-vectors/40',
    },
    symbol: '\\vec{v}',
    subskills: [
      { id: 'vec-arithmetic', name: 'Addition & scalar multiples' },
      { id: 'vec-magnitude', name: 'Magnitude & unit vectors' },
      { id: 'vec-dot', name: 'Dot product & angles' },
      { id: 'vec-cross', name: 'Cross product' },
    ],
    keyIdeas: [
      '$\\|\\mathbf{v}\\| = \\sqrt{v_1^2 + v_2^2 + v_3^2}$',
      '$\\mathbf{a}\\cdot\\mathbf{b} = \\|\\mathbf{a}\\|\\|\\mathbf{b}\\|\\cos\\theta$',
      'Perpendicular vectors have $\\mathbf{a}\\cdot\\mathbf{b} = 0$',
      '$\\mathbf{a}\\times\\mathbf{b}$ is perpendicular to both $\\mathbf{a}$ and $\\mathbf{b}$',
    ],
  },
  {
    id: 'matrices',
    name: 'Matrices',
    tagline: 'Transformations, systems and the shape of computation',
    whyItMatters:
      'Every rotation on screen, every neural-network layer and every graph adjacency table is a matrix.',
    color: {
      text: 'text-topic-matrices',
      bg: 'bg-topic-matrices',
      soft: 'bg-topic-matrices/10',
      border: 'border-topic-matrices/40',
    },
    symbol: 'A^{-1}',
    subskills: [
      { id: 'mat-multiply', name: 'Matrix multiplication' },
      { id: 'mat-determinant', name: 'Determinants' },
      { id: 'mat-inverse', name: 'Inverses' },
      { id: 'mat-transform', name: 'Linear transformations' },
    ],
    keyIdeas: [
      '$(AB)_{ij}$ = row $i$ of $A$ · column $j$ of $B$',
      '$AB \\neq BA$ in general — order matters',
      '$\\det\\begin{bmatrix}a&b\\\\c&d\\end{bmatrix} = ad - bc$',
      '$A^{-1}$ exists only when $\\det A \\neq 0$',
    ],
  },
  {
    id: 'limits',
    name: 'Limits',
    tagline: 'What happens as we get infinitely close',
    whyItMatters:
      'Limits underpin algorithm analysis (Big-O), convergence of iterative methods and the definition of the derivative.',
    color: {
      text: 'text-topic-limits',
      bg: 'bg-topic-limits',
      soft: 'bg-topic-limits/15',
      border: 'border-topic-limits/50',
    },
    symbol: '\\lim',
    subskills: [
      { id: 'lim-direct', name: 'Direct substitution' },
      { id: 'lim-factor', name: 'Indeterminate forms & factoring' },
      { id: 'lim-infinity', name: 'Limits at infinity' },
      { id: 'lim-special', name: 'Special limits & one-sided limits' },
    ],
    keyIdeas: [
      'Try substitution first; $\\tfrac{0}{0}$ means "simplify", not "undefined"',
      'At $\\infty$, compare the highest powers of top and bottom',
      '$\\displaystyle\\lim_{x\\to 0}\\frac{\\sin x}{x} = 1$',
      'A limit exists only if the left and right limits agree',
    ],
  },
  {
    id: 'differentiation',
    name: 'Differentiation',
    tagline: 'Rates of change and the slope of everything',
    whyItMatters:
      'Gradient descent — how machine-learning models learn — is differentiation applied millions of times.',
    color: {
      text: 'text-topic-differentiation',
      bg: 'bg-topic-differentiation',
      soft: 'bg-topic-differentiation/10',
      border: 'border-topic-differentiation/40',
    },
    symbol: '\\tfrac{dy}{dx}',
    subskills: [
      { id: 'diff-power', name: 'Power rule & basics' },
      { id: 'diff-product', name: 'Product & quotient rules' },
      { id: 'diff-chain', name: 'Chain rule' },
      { id: 'diff-apply', name: 'Tangents & optimisation' },
    ],
    keyIdeas: [
      '$\\frac{d}{dx}x^n = nx^{n-1}$',
      '$(uv)\' = u\'v + uv\'$',
      '$\\frac{d}{dx}f(g(x)) = f\'(g(x))\\,g\'(x)$',
      'Stationary points occur where $f\'(x) = 0$',
    ],
  },
]

export function getTopic(id: string): Topic | undefined {
  return TOPICS.find((t) => t.id === id)
}

export const LEVELS = [
  { level: 1, name: 'Foundation', points: 100 },
  { level: 2, name: 'Apply', points: 150 },
  { level: 3, name: 'Challenge', points: 200 },
] as const

export const DIFFICULTY_LEVELS = {
  warmup: [1, 1, 1, 2, 2, 2],
  standard: [1, 1, 2, 2, 3, 3],
  challenge: [2, 2, 2, 3, 3, 3],
} as const

export type Difficulty = keyof typeof DIFFICULTY_LEVELS

export const DIFFICULTIES: { id: Difficulty; name: string; blurb: string }[] = [
  { id: 'warmup', name: 'Warm-up', blurb: 'Build confidence with the fundamentals' },
  { id: 'standard', name: 'Standard', blurb: 'Foundation → Challenge, scaffolded' },
  { id: 'challenge', name: 'Challenge', blurb: 'Multi-step problems that need insight' },
]
