import MarksEntry from '../components/admin/MarksEntry';

export default function MarksEntryPage() {
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>
        Marks Entry
      </h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', marginBottom: 28, lineHeight: 1.6 }}>
        Enter subject paper scores for candidates. Marks must be approved before they are used in grade computation.
      </p>
      <MarksEntry />
    </div>
  );
}