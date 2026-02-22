import React from "react";
import "./ResultTable.css";

const normalizeVerification = (value = "") => {
  const normalized = value.toLowerCase();
  if (normalized.includes("vrai")) return "vraie";
  if (normalized.includes("faux") || normalized.includes("fauss")) return "fausse";
  if (normalized.includes("non") && normalized.includes("v")) return "non-verifiable";
  return "non-verifiable";
};

function ResultTable({ results, stats }) {
  if (!results || results.length === 0) {
    return (
      <section className="result-table-card">
        <h2>Résultats de la transcription</h2>
        <p className="empty-results">
          Aucun résultat pour le moment. Lance une transcription pour afficher le tableau.
        </p>
      </section>
    );
  }

  return (
    <section className="result-table-card">
      <h2>Résultats de la transcription</h2>
      <div className="table-stats">
        <span className="stat-pill">Idées: {stats.total}</span>
        <span className="stat-pill stat-true">Vraies: {stats.trueCount}</span>
        <span className="stat-pill stat-false">Fausses: {stats.falseCount}</span>
        <span className="stat-pill stat-neutral">
          Non vérifiables: {stats.unverifiableCount}
        </span>
      </div>
      <div className="table-scroll">
        <table className="results-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Information</th>
              <th>Vérification</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, index) => (
              <tr key={index}>
                <td className="index-col">{index + 1}</td>
                <td className="info-col">{result.Information}</td>
                <td className="status-col">
                  <span
                    className={`status-badge status-${normalizeVerification(
                      result.Vérification || ""
                    )}`}
                  >
                    {result.Vérification}
                  </span>
                </td>
                <td className="description-col">
                  <p className="description-text">{result.Description}</p>
                  <p className="description-source">
                    Source:{" "}
                    {result.SourceUrl ? (
                      <a
                        href={result.SourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="source-link"
                      >
                        {result.SourceLabel || "Lien"}
                      </a>
                    ) : (
                      <span>{result.SourceLabel || "Non disponible"}</span>
                    )}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default ResultTable;
