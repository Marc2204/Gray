import React, { useState, useRef } from "react";
import "../testDesign/EatingTest.css";
import Chatbot from "../pages/Chatbot";

const questions = [
  { id: 1, text: "Feeling nervous, anxious, or on edge?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 2, text: "Not being able to stop or control worrying?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 3, text: "Worrying too much about different things?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 4, text: "Trouble relaxing?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 5, text: "Being so restless that it is hard to sit still?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 6, text: "Becoming easily annoyed or irritable?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 7, text: "Feeling afraid as if something awful might happen?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] }
];

const optionValues = {
  "Not at all": 0,
  "Several days": 1,
  "More than half the days": 2,
  "Nearly every day": 3
};

const AnxietyTest = () => {
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [hybridRisk, setHybridRisk] = useState(null);
  const [isChatbotVisible, setIsChatbotVisible] = useState(false);
  const chatbotButtonRef = useRef(null);

  const toggleChatbot = () => setIsChatbotVisible(prev => !prev);

  const handleOptionSelect = (index, option) => {
    setAnswers(prev => ({ ...prev, [index]: option }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert("Please answer all the questions before submitting.");
      return;
    }

    // Convert answers to numeric features
    const features = questions.map((_, i) => optionValues[answers[i]]);
    const totalScore = features.reduce((sum, val) => sum + val, 0);
    setScore(totalScore);

    try {
      const response = await fetch("http://127.0.0.1:5000/gad7_risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_name: "Anonymous", // can replace with actual logged-in user
          answers: features,
          text: "User completed the anxiety test"
        })
      });

      const data = await response.json();
      setHybridRisk(data);

      // Interpret probability from LR
      const prob = data.lr_score;
      let anxietyResult;
      if (prob >= 0.75) {
        anxietyResult = {
          result: "Severe Anxiety – Consider professional help.",
          description: "Your score suggests severe anxiety. Please consult a professional."
        };
      } else if (prob >= 0.5) {
        anxietyResult = {
          result: "Moderate Anxiety – Keep monitoring.",
          description: "Your score suggests moderate anxiety."
        };
      } else if (prob >= 0.25) {
        anxietyResult = {
          result: "Mild Anxiety – Be mindful of your well-being.",
          description: "Your score suggests mild anxiety."
        };
      } else {
        anxietyResult = {
          result: "Minimal Anxiety – Keep taking care of yourself!",
          description: "Your score indicates minimal anxiety."
        };
      }

      setResult(anxietyResult);
      setShowResult(true);

      // Auto-open chatbot if severe anxiety
      if (anxietyResult.result.startsWith("Severe Anxiety")) {
        setIsChatbotVisible(true);
      }

    } catch (error) {
      console.error("Error fetching hybrid risk:", error);
      alert("Failed to compute risk. Please try again.");
    }
  };

  return (
    <div className="test-container">
      <h1>Anxiety Test (GAD-7)</h1>

      {!showResult ? (
        <div className="question-section">
          {questions.map((q, i) => (
            <div key={q.id} className="question-item">
              <p>{i + 1}. {q.text}</p>
              <div className="button-options">
                {q.options.map(option => (
                  <button
                    key={option}
                    onClick={() => handleOptionSelect(i, option)}
                    className={`option-button ${answers[i] === option ? "selected" : ""}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button onClick={handleSubmit} className="submit-button">SUBMIT</button>
          <div className="test-source">
            <h2>Source:</h2>
            <p>
              Developed by : Spitzer RL, Kroenke K, Williams JB, Löwe B. 
              A brief measure for assessing generalized anxiety disorder: the GAD-7. 
              Arch Intern Med. 2006;166(10):1092-1097.
            </p>
            <a
              href="https://www.mdcalc.com/calc/1725/gad-7-anxiety-scale"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://www.mdcalc.com/calc/1725/gad-7-anxiety-scale
            </a>
            <p>
              <strong>Please note:</strong> Online screening tools are not diagnostic instruments. 
              Share your results with a healthcare provider for proper evaluation.
            </p>
          </div>
        </div>
      ) : (
        <div className="result-section">
          <h2>Your Result:</h2>
          <p><strong>Score:</strong> {score} / {questions.length * 3}</p>
          <p><strong>{result.result}</strong></p>
          <p>{result.description}</p>

          {hybridRisk && (
            <div className="hybrid-risk-section">
              <h3>Hybrid Risk Assessment</h3>
              <p><strong>Logistic Regression Score:</strong> {hybridRisk.lr_score}</p>
              <p><strong>BERT Anomaly Score:</strong> {hybridRisk.bert_anomaly_score}</p>
              <p><strong>Final Risk:</strong> {hybridRisk.final_risk}</p>
              <p><strong>High Risk:</strong> {hybridRisk.is_high_risk ? "Yes" : "No"}</p>
            </div>
          )}

          <h3>Your Answers:</h3>
          <ul>
            {questions.map((q, i) => (
              <li key={q.id}>
                <strong>{i + 1}. {q.text}</strong>
                <br />
                <span style={{ color: "#048bb8" }}>Your answer: {answers[i]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showResult && (
        <button onClick={toggleChatbot} ref={chatbotButtonRef} className="footer-button">
          {isChatbotVisible ? "Hide Chatbot" : "Open Chatbot"}
        </button>
      )}

      {isChatbotVisible && (
        <div className="chatbot-wrapper">
          <Chatbot severeAlert={result?.result.startsWith("Severe Anxiety")} />
        </div>
      )}
    </div>
  );
};

export default AnxietyTest;
