import { useState, useEffect } from "react";
import MainLayout from "../components/layout/MainLayout";
import { getAlternatives } from "../api/alternativesApi";
import "../styles/Alternatives.css";

export default function Alternatives() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [sort, setSort] = useState("price");
  const [recommendedOnly, setRecommendedOnly] = useState(false);
  const [saltMatchOnly, setSaltMatchOnly] = useState(false);

  /* SEARCH */

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (!query.trim()) return setResults([]);

      const res = await getAlternatives(query);
      setResults(res);
    }, 350);

    return () => clearTimeout(delay);
  }, [query]);

  /* FILTER + SORT */

  useEffect(() => {
    let data = [...results];

    if (recommendedOnly) data = data.filter((i) => i.recommended);
    if (saltMatchOnly) data = data.filter((i) => i.saltMatch);

    if (sort === "price") data.sort((a, b) => a.price - b.price);
    if (sort === "savings")
      data.sort(
        (a, b) =>
          b.originalPrice - b.price - (a.originalPrice - a.price)
      );

    setFiltered(data);
  }, [results, sort, recommendedOnly, saltMatchOnly]);

  return (
    <MainLayout>
      <div className="alt-wrapper">

        {/* HEADER */}
        <div className="alt-header">
          <h1>Alternative Medicines</h1>
          <p>Find cheaper alternatives with similar composition.</p>
        </div>

        {/* SEARCH */}
        <div className="alt-search">
          <input
            placeholder="Search medication..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* FILTER BAR */}
        <div className="alt-controls">

          <select onChange={(e) => setSort(e.target.value)}>
            <option value="price">Sort by Price</option>
            <option value="savings">Sort by Savings</option>
          </select>

          <label>
            <input
              type="checkbox"
              checked={recommendedOnly}
              onChange={() => setRecommendedOnly(!recommendedOnly)}
            />
            Recommended Only
          </label>

          <label>
            <input
              type="checkbox"
              checked={saltMatchOnly}
              onChange={() => setSaltMatchOnly(!saltMatchOnly)}
            />
            Exact Salt Match
          </label>

        </div>

        {/* RESULTS */}
        <div className="alt-results">

          {!query && (
            <div className="alt-empty">
              <h3>Search a medication</h3>
              <p>We’ll suggest cheaper alternatives instantly.</p>
            </div>
          )}

          {filtered.map((item) => (
            <div key={item.id} className="alt-card">

              {/* BADGES */}
              <div className="badges">
                {item.recommended && (
                  <span className="badge best">Best Choice</span>
                )}
                {item.saltMatch && (
                  <span className="badge salt">Salt Match</span>
                )}
              </div>

              <h2>{item.name}</h2>

              <div className="alt-row">
                <span className="label">Price</span>
                <span className="value">${item.price}</span>
              </div>

              <div className="alt-row savings">
                Save ${item.originalPrice - item.price}
              </div>

              <div className="alt-row">
                <span className="label">Salts</span>
                <span className="value">{item.salts}</span>
              </div>

              <button className="compare-btn">Compare</button>

            </div>
          ))}

        </div>
      </div>
    </MainLayout>
  );
}