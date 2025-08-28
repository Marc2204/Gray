import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../componentDesign/TestButtons.css";
import { auth } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";

const TestButtons = () => {
  const [user, setUser] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [hasCommented, setHasCommented] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);
  
  const handleTestClick = (path) => {
    if (user) {
      navigate(path);
    } else {
      setShowLoginPrompt(true);
    }
  };

  return (
    <div className="test-buttons">
      <div className="test-buttons-title">
        <h2>Take a Mental Health Test</h2>
      </div>

        <div className="test-button-group">
          <button className="test-button" onClick={() => handleTestClick("/anxiety")}>
            Anxiety Test
          </button>
          <button className="test-button" onClick={() => handleTestClick("/depression")}>
            Depression Test
          </button>
          <button className="test-button" onClick={() => handleTestClick("/well-being")}>
            Well-Being Test
          </button>
          <button className="test-button" onClick={() => handleTestClick("/eating-disorder")}>
            Personality Test
          </button>
        </div>
     

      {showLoginPrompt && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Login Required</h3>
            <p>You need to log in before accessing the tests.</p>
            <button
              className="close-modal-btn"
              onClick={() => setShowLoginPrompt(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestButtons;
