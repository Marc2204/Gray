import React, { useState, useRef, useEffect } from "react";
import "../testDesign/EatingTest.css";
import Chatbot from "../pages/Chatbot";

const questions = [
  { id: 1, text: "Feeling nervous, anxious, or on edge?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 2, text: "Not being able to stop or control worrying?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 3, text: "Worrying too much about different things?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 4, text: "Trouble relaxing?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 5, text: "Being so restless that it is hard to sit still?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 6, text: "Becoming easily annoyed or irritable?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 7, text: "Feeling afraid as if something awful might happen?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
];

const optionValues = {
  "Not at all": 0,
  "Several days": 1,
  "More than half the days": 2,
  "Nearly every day": 3,
};

const logisticRegression = (score) => {
  if (score >= 15) {
    return {
      result: "Severe Anxiety – Consider professional help.",
      description: "Your score suggests that you may be experiencing severe anxiety. It is recommended that you seek professional help, such as a therapist or counselor."
    };
  } else if (score >= 10) {
    return {
      result: "Moderate Anxiety – Keep monitoring.",
      description: "Your score suggests moderate anxiety. You may be experiencing stress or anxiety that is affecting your ability to relax or concentrate."
    };
  } else if (score >= 5) {
    return {
      result: "Mild Anxiety – Be mindful of your well-being.",
      description: "Your score suggests mild anxiety. This level may be temporary and linked to stress or life events."
    };
  } else {
    return {
      result: "Minimal Anxiety – Keep taking care of yourself!",
      description: "Your score indicates minimal anxiety, which is great."
    };
  }
};

const AnxietyTest = () => {
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [hybridRisk, setHybridRisk] = useState(null);
  const [isChatbotVisible, setIsChatbotVisible] = useState(false);

  const chatbotButtonRef = useRef(null);

  const toggleChatbot = () => {
    setIsChatbotVisible((prev) => !prev);
  };

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

  const handleOptionSelect = (questionIndex, selectedOption) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: selectedOption,
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert("Please answer all the questions before submitting.");
      return;
    }

    const totalScore = Object.values(answers)
      .map((ans) => optionValues[ans])
      .reduce((sum, value) => sum + value, 0);

    const anxietyResult = logisticRegression(totalScore);
    setScore(totalScore);
    setResult(anxietyResult);
    setShowResult(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/hybrid_risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lr_score: totalScore / (questions.length * 3), // normalized 0–1
          text: "User completed the anxiety test" // Replace with actual free text if available
        })
      });

      const data = await response.json();
      setHybridRisk(data);
    } catch (error) {
      console.error("Error sending hybrid risk data:", error);
    }

    if (anxietyResult.result.startsWith("Severe Anxiety")) {
      setIsChatbotVisible(true);
    }
  };

  return (
    <div className="test-container">
      <h1>Anxiety Test (GAD-7)</h1>

      {!showResult ? (
        <div className="question-section">
          {questions.map((question, index) => (
            <div key={question.id} className="question-item">
              <p>{index + 1}. {question.text}</p>
              <div className="button-options">
                {question.options.map((option) => (
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
              Developed by : Kroenke K, Spitzer RL, Williams JB. The PHQ-9: Validity of a brief depression severity measure. Journal of General Internal Medicine. 2001;16(9):606-613.
            </p>
            <a href="https://www2.gov.bc.ca/assets/gov/health/practitioner-pro/bc-guidelines/depression_patient_health_questionnaire.pdf?fbclid=IwY2xjawMacT9leHRuA2FlbQIxMABicmlkETFVcVhYUmlucm9DelMxR0M2AR783ZyYa5Ux0q8tOlBbQTxtFUkiMBB18cuzeJ2GLsdhihkfjSCLqyICSt6S6g_aem_ENDrl0SsoTh_OQ-ePRgO7w" target="_blank" rel="noopener noreferrer">
              https://www2.gov.bc.ca/assets/gov/health/practitioner-pro/bc-guidelines/depression_patient_health_questionnaire.pdf
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
            <div className="hybrid-risk-section" style={{ marginTop: "1.5rem" }}>
              <h3>Hybrid Risk Assessment</h3>
              <p><strong>Logistic Regression Score:</strong> {hybridRisk.lr_score}</p>
              <p><strong>BERT Anomaly Score:</strong> {hybridRisk.bert_anomaly_score}</p>
              <p><strong>Final Risk:</strong> {hybridRisk.final_risk}</p>
              <p><strong>High Risk:</strong> {hybridRisk.is_high_risk ? "Yes" : "No"}</p>
            </div>
            
          )}

          <h3>Your Answers:</h3>
          <ul>
            {questions.map((question, index) => (
              <li key={question.id}>
                <strong>{index + 1}. {question.text}</strong><br />
                <span style={{ color: "#048bb8" }}>
                  Your answer: {answers[index]}
                </span>
              </li>
            ))}
          </ul>
          <p style={{ marginTop: "2rem" }}>
            <strong>Note:</strong> Online screening tools are not diagnostic instruments. Share your results with a physician or healthcare provider.
          </p>
        </div>
      )}

      {showResult && (
        <button
          onClick={toggleChatbot}
          ref={chatbotButtonRef}
          className="footer-button"
        >
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
