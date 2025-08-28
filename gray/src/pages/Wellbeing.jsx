import React from "react";
import { useNavigate } from "react-router-dom";
import "./anxiety.css";
const Wellbeing = () => {
  const navigate = useNavigate();

  return (
    <div className="mental-container">
      <div className="mental-description">
        <h2>Well-Being Test</h2>
        <p>
          The <strong>WHO-5 (Well-Being Index)</strong> is a short and simple questionnaire developed by the World Health Organization. It helps assess your <strong>emotional well-being over the last two weeks</strong>. This is <em>not a diagnostic tool</em>, but rather a way to reflect on how you're feeling and whether you might benefit from support.
        </p>
        <p>
          You'll be asked to respond to <strong>5 statements</strong> related to:
          <ul>
            <li>Your mood</li>
            <li>Your energy levels</li>
            <li>Your sense of interest and enjoyment in daily life</li>
          </ul>
        </p>
        <p>
          Each statement should be rated based on how often you’ve felt that way recently — from <em>"At no time"</em> to <em>"All of the time"</em>.
        </p>
        <p>
           <strong>What this test can help with:</strong>
          <ul>
            <li>Gaining insight into your current mental well-being</li>
            <li>Identifying if further support might be helpful</li>
            <li>Tracking your well-being over time</li>
          </ul>
        </p>
        <button className="start-test-btn" onClick={() => navigate("/well-being-test")}>
          Start Test
        </button>
      </div>
    </div>
  );
};

export default Wellbeing;
