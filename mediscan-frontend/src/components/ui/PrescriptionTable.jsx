export default function PrescriptionTable({ data }) {
  return (
    <div className="table-card">
      <div className="table-header">
        <h3>Recent Prescriptions</h3>
      </div>

      <table>
        <thead>
          <tr>
            <th>Document</th>
            <th>Doctor</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.doctor}</td>
              <td><span className={`status ${item.status.toLowerCase()}`}>{item.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}