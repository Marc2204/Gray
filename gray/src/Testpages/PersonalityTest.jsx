import React, { useState } from "react";
import "../testDesign/EatingTest.css";

const questions = [
  { id: 1, text: "I see myself as someone who is reserved.", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: 2, text: "I see myself as someone who is generally trusting.", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: 3, text: "I see myself as someone who tends to be lazy.", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: 4, text: "I see myself as someone who is relaxed, handles stress well.", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: 5, text: "I see myself as someone who has few artistic interests.", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: 6, text: "I see myself as someone who is outgoing, sociable.", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: 7, text: "I see myself as someone who tends to find fault with others.", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: 8, text: "I see myself as someone who does a thorough job.", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: 9, text: "I see myself as someone who gets nervous easily.", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: 10, text: "I see myself as someone who has an active imagination.", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
];

const optionValues = {
  "Strongly Disagree": 1,
  "Disagree": 2,
  "Neutral": 3,
  "Agree": 4,
  "Strongly Agree": 5,
};

const calculatePersonality = (scores) => {
  return {
    Extraversion: scores[0] + scores[5],
    Agreeableness: scores[1] + (6 - scores[6]),
    Conscientiousness: scores[7] + (6 - scores[2]),
    Neuroticism: scores[8] + (6 - scores[3]),
    Openness: scores[9] + (6 - scores[4]),
  };
};

const traitDescriptions = {
  Extraversion: "Extraversion reflects how outgoing, energetic, and sociable you are. High scores indicate enthusiasm and assertiveness.",
  Agreeableness: "Agreeableness indicates compassion and cooperativeness toward others. Higher scores reflect empathy and generosity.",
  Neuroticism: "Neuroticism reflects emotional instability. Higher scores suggest sensitivity and moodiness.",
  Openness: "Openness describes imagination and curiosity. High scores show creativity and preference for variety.",
  Conscientiousness: "Conscientiousness is about being organized, dependable, and goal-oriented. Higher scores indicate reliability and discipline.",
};

const PersonalityTest = () => {
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [hybridRisk, setHybridRisk] = useState(null);

  const handleOptionSelect = (index, option) => {
    setAnswers(prev => ({ ...prev, [index]: option }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert("Please answer all questions.");
      return;
    }

    const scores = Object.values(answers).map(ans => optionValues[ans]);
    const traits = calculatePersonality(scores);
    setResult(traits);

    const normalizedScore = scores.reduce((a, b) => a + b, 0) / (questions.length * 5);

    try {
      const res = await fetch("http://127.0.0.1:5000/bfi10_risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_name: "Test User",
          answers: answers,
          traits: traits,
          lr_score: normalizedScore,
          text: "I took a personality test today.", // 👈 Example text for BERT anomaly
        }),
      });

      const data = await res.json();
      setHybridRisk(data);
    } catch (err) {
      console.error("Error fetching hybrid risk:", err);
    }

    setShowResult(true);
  };

  return (
    <div className="test-container">
      {!showResult ? (
        <div className="question-section">
          <h1>Personality Test (BFI-10)</h1>
          {questions.map((q, i) => (
            <div key={q.id} className="question-item">
              <p>{i + 1}. {q.text}</p>
              <div className="button-options">
                {q.options.map(option => (
                  <button
                    key={option}
                    className={`option-button ${answers[i] === option ? "selected" : ""}`}
                    onClick={() => handleOptionSelect(i, option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button className="submit-button" onClick={handleSubmit}>SUBMIT</button>
          <div className="test-source">
            <h2>Source:</h2>
          <p>
            The BFI-10 was developed simultaneously in several samples in both English and German.It retains significant levels of reliability and validity compared to the full BFI-44.
          </p>
            <a href="https://homepages.se.edu/cvonbergen/files/2013/01/Measuring-Personality-in-One-Minute-or-Less_A-10-Item-Short-Version-of-the-Big-Five-Inventory-in-English-and-German.pdf" target="_blank"
            rel="noopener noreferrer">https://homepages.se.edu/cvonbergen/files/2013/01/Measuring-Personality-in-One-Minute-or-Less_A-10-Item-Short-Version-of-the-Big-Five-Inventory-in-English-and-German.pdf</a>
          </div>
        </div>
      ) : (
        <div className="result-section">
          <h2>Your Personality Trait Scores</h2>
          <ul>
            {Object.entries(result).map(([trait, value]) => (
              <li key={trait}>
                <strong>{trait}:</strong> {value} <br />
                <span className="trait-description">{traitDescriptions[trait]}</span>
              </li>
            ))}
          </ul>

          {hybridRisk && (
            <div className="hybrid-risk-section">
              <h3>Hybrid Risk Analysis</h3>
              <p><strong>Logistic Regression Score:</strong> {hybridRisk.lr_score}</p>
              <p><strong>BERT Anomaly Score:</strong> {hybridRisk.bert_anomaly_score}</p>
              <p><strong>Hybrid Score:</strong> {hybridRisk.hybrid_score}</p>
              <p><strong>Risk Level:</strong> {hybridRisk.risk_level}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PersonalityTest;
