export default function ScheduleCard({ data }) {
  return (
    <div className="schedule-card">
      <h3>Daily Schedule</h3>

      {data.map((item) => (
        <div key={item.id} className="schedule-item">
          <strong>{item.time}</strong>
          <p>{item.medicine}</p>
        </div>
      ))}
    </div>
  );
}