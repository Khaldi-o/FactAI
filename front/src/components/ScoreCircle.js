import React from "react";
import "./ScoreCircle.css";

const ScoreCircle = ({ percentage, stats }) => {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const safePercentage = Math.max(0, Math.min(100, percentage || 0));
  const strokeDashoffset =
    circumference - (safePercentage / 100) * circumference;
  const strokeColor =
    safePercentage >= 70 ? "#33d99e" : safePercentage >= 45 ? "#f6c36b" : "#ff697e";

  return (
    <section className="score-card">
      <h3>Score de fiabilité</h3>
      <svg width={200} height={200}>
        <circle
          cx={100}
          cy={100}
          r={radius}
          stroke="#333333"
          strokeWidth={8}
          fill="none"
        />
        <circle
          cx={100}
          cy={100}
          r={radius}
          stroke={strokeColor}
          strokeWidth={8}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 650ms ease, stroke 300ms ease" }}
          fill="none"
          transform="rotate(-90 100 100)"
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fff"
          style={{ fontSize: "26px", fontWeight: 700 }}
        >
          {`${Math.round(safePercentage)}%`}
        </text>
      </svg>
      <p className="score-subtitle">
        {stats.trueCount} vraies, {stats.falseCount} fausses, {stats.unverifiableCount} non vérifiables
      </p>
    </section>
  );
};

export default ScoreCircle;
