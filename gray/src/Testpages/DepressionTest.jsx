import React, { useState, useRef, useEffect } from "react"; // [ADDED useRef, useEffect]
import "../testDesign/EatingTest.css";
import Chatbot from "../pages/Chatbot"; // already present

// PHQ-9 Questions
const questions = [
  { id: 1, text: "Little interest or pleasure in doing things?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 2, text: "Feeling down, depressed, or hopeless?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 3, text: "Trouble falling or staying asleep, or sleeping too much?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 4, text: "Feeling tired or having little energy?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 5, text: "Poor appetite or overeating?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 6, text: "Feeling bad about yourself—or that you are a failure or have let yourself or your family down?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 7, text: "Trouble concentrating on things, such as reading the newspaper or watching television?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 8, text: "Moving or speaking so slowly that other people could have noticed? Or the opposite—being so fidgety or restless that you have been moving around a lot more than usual?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 9, text: "Thoughts that you would be better off dead, or of hurting yourself in some way?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
];

const optionValues = {
  "Not at all": 0,
  "Several days": 1,
  "More than half the days": 2,
  "Nearly every day": 3,
};

// Score interpretation
const getDepressionResult = (score) => {
  if (score >= 20) {
    return {
      result: "Severe Depression – Please seek professional help.",
      description: "Your score suggests severe depression. It's strongly recommended that you consult a mental health professional for a full evaluation and support. You are not alone, and there are treatments that can help.",
    };
  } else if (score >= 15) {
    return {
      result: "Moderately Severe Depression – Consider speaking with a professional.",
      description: "Your score suggests a significant level of depression. It would be beneficial to speak with a therapist or counselor to explore ways to feel better and receive appropriate care.",
    };
  } else if (score >= 10) {
    return {
      result: "Moderate Depression – Monitor and take care of yourself.",
      description: "You may be experiencing some symptoms of depression. While it may not require immediate intervention, it's important to monitor your mental health and practice good self-care. If symptoms persist, seek guidance.",
    };
  } else if (score >= 5) {
    return {
      result: "Mild Depression – Be mindful of your mental well-being.",
      description: "Your score suggests mild depression. Life stressors may be contributing, so focus on self-care and emotional wellness. If symptoms increase, consider reaching out for help.",
    };
  } else {
    return {
      result: "Minimal Depression – You're doing well.",
      description: "Your score indicates minimal or no depression symptoms. Keep taking care of your mental health and seek support if things change.",
    };
  }
};

const DepressionTest = () => {
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [hybridRisk, setHybridRisk] = useState(null);

  // [ADDED] chatbot states
  const [isChatbotVisible, setIsChatbotVisible] = useState(false);
  const chatbotButtonRef = useRef(null);

  const handleOptionSelect = (questionIndex, selectedOption) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: selectedOption,
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    const totalScore = Object.values(answers)
      .map((ans) => optionValues[ans])
      .reduce((sum, value) => sum + value, 0);

    const evaluation = getDepressionResult(totalScore);
    setScore(totalScore);
    setResult(evaluation);

    // [ADDED] auto-show chatbot for moderate/severe
    if (
      evaluation.result.startsWith("Severe Depression") ||
      evaluation.result.startsWith("Moderately Severe Depression")
    ) {
      setIsChatbotVisible(true);
    }

    // Send to Flask hybrid_risk endpoint
    try {
      const response = await fetch("http://127.0.0.1:5000/hybrid_risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lr_score: totalScore / (questions.length * 3), // normalize 0-1
          text: "User's PHQ-9 depression test responses"
        }),
      });

      const data = await response.json();
      setHybridRisk(data);
    } catch (error) {
      console.error("Error fetching hybrid risk:", error);
    }

    setShowResult(true);
  };

  // [ADDED] chatbot toggle
  const toggleChatbot = () => {
    setIsChatbotVisible((prev) => !prev);
  };

  // [ADDED] draggable chatbot button
  useEffect(() => {
    const button = chatbotButtonRef.current;
    if (!button) return;

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    const onMouseDown = (e) => {
      isDragging = true;
      offsetX = e.clientX - button.getBoundingClientRect().left;
      offsetY = e.clientY - button.getBoundingClientRect().top;
      button.style.transition = "none";
    };

    const onMouseMove = (e) => {
      if (isDragging) {
        button.style.left = `${e.clientX - offsetX}px`;
        button.style.top = `${e.clientY - offsetY}px`;
        button.style.bottom = "auto";
        button.style.right = "auto";
        button.style.position = "fixed";
      }
    };

    const onMouseUp = () => {
      isDragging = false;
      button.style.transition = "";
    };

    button.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      button.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return (
    <div className="test-container">
      {!showResult ? (
        <div className="question-section">
          <h1>Depression Test (PHQ-9)</h1>
          {questions.map((q, index) => (
            <div key={q.id} className="question-item">
              <p>{index + 1}. {q.text}</p>
              <div className="button-options">
                {q.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleOptionSelect(index, option)}
                    className={`option-button ${answers[index] === option ? "selected" : ""}`}
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
              Developed by Drs. Robert L. Spitzer, Janet B.W. Williams, Kurt Kroenke and colleagues, with an educational grant from Pfizer Inc.
            </p>
            <a href="https://www.apa.org/depression-guideline/patient-health-questionnaire.pdf" target="_blank" rel="noopener noreferrer">
              https://www.apa.org/depression-guideline/patient-health-questionnaire.pdf
            </a>
            <p><strong>Please note:</strong> Online screening tools are not diagnostic instruments. You are encouraged to share your results with a physician or healthcare provider.</p>
          </div>
        </div>
      ) : (
        <div className="result-section">
          <h2>Your Result:</h2>
          <p><strong>Score:</strong> {score} / {questions.length * 3}</p>
          <p><strong>{result.result}</strong></p>
          <p>{result.description}</p>

          {hybridRisk && (
            <div style={{ marginTop: "2rem" }}>
              <h3>Hybrid Risk Analysis</h3>
              <p><strong>LR Score:</strong> {hybridRisk.lr_score}</p>
              <p><strong>BERT Score:</strong> {hybridRisk.bert_score}</p>
              <p><strong>Hybrid Risk Score:</strong> {hybridRisk.hybrid_risk_score}</p>
              <p><strong>Risk Level:</strong> {hybridRisk.risk_level}</p>
            </div>
          )}

          <h3>Your Answers:</h3>
          <ul>
            {questions.map((q, index) => (
              <li key={q.id}>
                <strong>{index + 1}. {q.text}</strong><br />
                <span style={{ color: "#048bb8" }}>Your answer: {answers[index]}</span>
              </li>
            ))}
          </ul>
          <p style={{ marginTop: "3rem", textAlign: "justify" }}>
            <strong>Please note:</strong> Online screening tools are not diagnostic instruments. You are encouraged to share your results with a physician or healthcare provider.
          </p>

          {/* [ADDED] chatbot toggle button */}
          {showResult && (
            <button
              onClick={toggleChatbot}
              ref={chatbotButtonRef}
              className="footer-button"
            >
              {isChatbotVisible ? "Hide Chatbot" : "Open Chatbot"}
            </button>
          )}

          {/* [ADDED] chatbot display */}
          {isChatbotVisible && (
            <div className="chatbot-wrapper">
              <Chatbot severeAlert={result?.result.startsWith("Severe Depression")} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DepressionTest;
