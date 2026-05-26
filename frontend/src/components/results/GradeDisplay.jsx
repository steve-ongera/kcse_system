/**
 * Renders a coloured grade pill + points badge.
 * grade: string like "A", "B+", "C-", etc.
 * points: number
 * size: "sm" | "md" | "lg"
 */

const GRADE_COLORS = {
  'A':  { bg: '#0a4a2f', text: '#fff' },
  'A-': { bg: '#1e7a4e', text: '#fff' },
  'B+': { bg: '#2e9668', text: '#fff' },
  'B':  { bg: '#3aad7c', text: '#fff' },
  'B-': { bg: '#5bbf94', text: '#fff' },
  'C+': { bg: '#c8a84b', text: '#fff' },
  'C':  { bg: '#d4a020', text: '#fff' },
  'C-': { bg: '#c8780a', text: '#fff' },
  'D+': { bg: '#b85a18', text: '#fff' },
  'D':  { bg: '#b03a2e', text: '#fff' },
  'D-': { bg: '#922820', text: '#fff' },
  'E':  { bg: '#6b1c14', text: '#fff' },
  'X':  { bg: '#8a8580', text: '#fff' },
};

const SIZES = {
  sm: { pill: 32, font: '0.8rem' },
  md: { pill: 44, font: '1rem' },
  lg: { pill: 60, font: '1.3rem' },
};

export default function GradeDisplay({ grade, points, size = 'md', showPoints = true }) {
  const colors = GRADE_COLORS[grade] || { bg: '#8a8580', text: '#fff' };
  const dim = SIZES[size] || SIZES.md;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: dim.pill,
        height: dim.pill,
        borderRadius: '50%',
        background: colors.bg,
        color: colors.text,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: dim.font,
        flexShrink: 0,
        boxShadow: `0 2px 8px ${colors.bg}55`,
      }}>
        {grade || '—'}
      </div>
      {showPoints && points != null && (
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: colors.bg,
          background: `${colors.bg}18`,
          padding: '2px 8px',
          borderRadius: 99,
        }}>
          {points} {points === 1 ? 'pt' : 'pts'}
        </div>
      )}
    </div>
  );
}