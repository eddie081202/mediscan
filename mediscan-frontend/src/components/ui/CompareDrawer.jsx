export default function CompareDrawer({ items, clear }) {
  return (
    <div className="compare-drawer">
      <h3>Compare Medicines</h3>

      <div className="compare-grid">
        {items.map((i) => (
          <div key={i.id}>
            <h4>{i.name}</h4>
            <p>Price: ${i.price}</p>
            <p>Salts: {i.salts}</p>
          </div>
        ))}
      </div>

      <button onClick={clear}>Clear</button>
    </div>
  );
}