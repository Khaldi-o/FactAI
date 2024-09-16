import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import TranscriptionForm from "./components/TranscriptionForm";
import ResultTable from "./components/ResultTable";
import "./App.css";
import ScoreCircle from "./components/ScoreCircle";
import Sidebar from "./components/Sidebar";
import Home from "./components/Home";
import Profile from "./components/Profile";

function App() {
  const [transcriptionResults, setTranscriptionResults] = useState([]);

  const handleTranscriptionComplete = (results) => {
    setTranscriptionResults(results);
  };

  const calculateTruthPercentage = (results) => {
    const totalCount = results.length;
    const trueCount = results.filter(
      (result) => result.Vérification === "Vraie"
    ).length;
    return totalCount > 0 ? Math.round((trueCount / totalCount) * 100) : 0;
  };

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
                  <ResultTable results={transcriptionResults} />
                  <ScoreCircle
                    percentage={calculateTruthPercentage(transcriptionResults)}
                  />
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
