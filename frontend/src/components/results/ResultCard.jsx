import GradeDisplay from './GradeDisplay';

const STATUS_LABELS = {
  APPROVED:  { label: 'Approved',  cls: 'badge-green' },
  VALIDATED: { label: 'Validated', cls: 'badge-green' },
  WITHHELD:  { label: 'Withheld',  cls: 'badge-red'   },
  CANCELLED: { label: 'Cancelled', cls: 'badge-red'   },
  ABSENT:    { label: 'Absent',    cls: 'badge-gray'  },
  PENDING:   { label: 'Pending',   cls: 'badge-gold'  },
};

export default function ResultCard({ result, index }) {
  const {
    subject_code, subject_name, subject_type,
    final_score, grade_letter, grade_points, status
  } = result;

  const statusInfo = STATUS_LABELS[status] || { label: status, cls: 'badge-gray' };

  return (
    <div
      className="animate-fade-up"
      style={{
        animationDelay: `${index * 40}ms`,
        display: 'grid',
        gridTemplateColumns: '1fr auto auto',
        alignItems: 'center',
        gap: 16,
        padding: '14px 20px',
        borderBottom: '1px solid var(--clr-border-subtle)',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--clr-surface-2)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Subject info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: 'var(--clr-primary-muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
            fontWeight: 700, color: 'var(--clr-primary)',
          }}>{subject_code}</span>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontWeight: 600, fontSize: '0.92rem',
            color: 'var(--clr-text)', whiteSpace: 'nowrap',
            overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{subject_name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>
            {formatSubjectType(subject_type)}
            {final_score != null && (
              <span style={{ marginLeft: 8, fontFamily: 'var(--font-mono)' }}>
                {parseFloat(final_score).toFixed(1)} / 100
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Status badge */}
      <span className={`badge ${statusInfo.cls}`}
        style={{ display: 'none' }}  // visible on wider screens via CSS
      >{statusInfo.label}</span>

      {/* Grade */}
      <GradeDisplay grade={grade_letter} points={grade_points} size="sm" />
    </div>
  );
}

function formatSubjectType(type) {
  const map = {
    COMPULSORY: 'Compulsory',
    GROUP_1: 'Group 1 – Languages',
    GROUP_2: 'Group 2 – Humanities',
    GROUP_3: 'Group 3 – Sciences',
    GROUP_4: 'Group 4 – Technical',
    GROUP_5: 'Group 5 – Arts',
  };
  return map[type] || type;
}