import React from "react";
import "./ResultTable.css";

function ResultTable({ results }) {
  return (
    <div>
      <h2>Résultats de la transcription</h2>
      <div style={{ maxHeight: "'700px", overflowY: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Information</th>
              <th>Vérification</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, index) => (
              <tr key={index}>
                <td>{result.Information}</td>
                <td>{result.Vérification}</td>
                <td>{result.Description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ResultTable;
