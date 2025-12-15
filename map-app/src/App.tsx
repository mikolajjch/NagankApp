import { useState } from "react";

export default function App() {
  const [pointsCount, setPointsCount] = useState(0);

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>System Wizualizacji Danych Przestrzennych</h1>

      <p>
        Liczba punktów w systemie: <strong>{pointsCount}</strong>
      </p>

      <button onClick={() => setPointsCount(pointsCount + 1)}>
        Dodaj punkt (symulacja)
      </button>
    </div>
  );
}
