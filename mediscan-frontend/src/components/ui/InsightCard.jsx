export default function InsightCard({ title, text }) {
  return (
    <div className="insight-card">
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}