import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import TranscriptionForm from "./components/TranscriptionForm";
import ResultTable from "./components/ResultTable";
import "./App.css";
import ScoreCircle from "./components/ScoreCircle";
import Sidebar from "./components/Sidebar";
import Home from "./components/Home";
import Profile from "./components/Profile";

const normalizeVerification = (value = "") => {
  const normalized = value.toLowerCase();
  if (normalized.includes("vrai")) return "true";
  if (normalized.includes("faux") || normalized.includes("fauss")) return "false";
  if (normalized.includes("non") && normalized.includes("v")) return "unverifiable";
  return "unverifiable";
};

function App() {
  const [transcriptionResults, setTranscriptionResults] = useState([]);

  const handleTranscriptionComplete = (results) => {
    setTranscriptionResults(results);
  };

  const calculateVerificationStats = (results) => {
    let trueCount = 0;
    let falseCount = 0;
    let unverifiableCount = 0;
    let scoreAccumulator = 0;

    results.forEach((result) => {
      const category = normalizeVerification(result.Vérification || "");
      if (category === "true") {
        trueCount += 1;
        scoreAccumulator += 1;
      } else if (category === "false") {
        falseCount += 1;
      } else {
        unverifiableCount += 1;
        scoreAccumulator += 0.5;
      }
    });

    const total = results.length;
    const score = total > 0 ? Math.round((scoreAccumulator / total) * 100) : 0;

    return { total, trueCount, falseCount, unverifiableCount, score };
  };

  const stats = calculateVerificationStats(transcriptionResults);

  return (
    <Router>
      <div className="app">
        <Sidebar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/app"
              element={
                <div className="container">
                  <h1>Vérification des faits</h1>
                  <TranscriptionForm
                    onTranscriptionComplete={handleTranscriptionComplete}
                  />
                  <ResultTable results={transcriptionResults} stats={stats} />
                  <ScoreCircle percentage={stats.score} stats={stats} />
                </div>
              }
            />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
