/**
 * A numbered schedule of notes, set in the margin the way a drawing sheet sets
 * them: a mono head, then figures in a column with the prose ranged off them.
 *
 * It is what a page puts at the foot of a column when the column has said its
 * piece and there is sheet left over — the sign-in plate, the basket, the
 * shortlist. Two tones, because one of those three is printed on black.
 */
export default function SheetNotes({
  title,
  items,
  tone = "light",
  className = "",
}: {
  title: string;
  items: string[];
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <div className={`sheet-notes ${className}`} data-tone={tone}>
      <p className="sheet-notes-title">{title}</p>
      <ol className="sheet-notes-list">
        {items.map((item, i) => (
          <li key={item} className="sheet-note">
            <span className="sheet-note-no">{String(i + 1).padStart(2, "0")}</span>
            <span className="sheet-note-text">{item}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
