import React, { useState, useEffect } from "react";

const ScoreCircle = ({ percentage }) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  useEffect(() => {
    const animationDuration = 1000;
    const step = (percentage - animatedPercentage) / (animationDuration / 16.7);

    const animationInterval = setInterval(() => {
      if (animatedPercentage < percentage) {
        setAnimatedPercentage(animatedPercentage + step);
      } else {
        clearInterval(animationInterval);
      }
    }, 16.7);

    return () => {
      clearInterval(animationInterval);
    };
  }, [percentage, animatedPercentage]);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (animatedPercentage / 100) * circumference;

  return (
    <div style={{ width: "200px", height: "200px" }}>
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
          stroke="#e91e63"
          strokeWidth={8}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          fill="none"
          transform="rotate(-90 100 100)"
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fff"
        >
          {`${Math.round(animatedPercentage)}%`}
        </text>
      </svg>
    </div>
  );
};

export default ScoreCircle;
