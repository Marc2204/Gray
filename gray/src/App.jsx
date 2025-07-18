import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./Dashboard";
import Anxiety from "./pages/Anxiety";
import Depression from "./pages/Depression";
import WellBeing from "./pages/Wellbeing";
import EatingDisorder from "./pages/Personality";
import AnxietyTest from "./Testpages/AnxietyTest";
import DepressionTest from "./Testpages/DepressionTest";
import EatingTest from "./Testpages/PersonalityTest";
import WellTest from "./Testpages/WellTest";
import Chatbot from "./pages/Chatbot";
import "./Dashboard.css";
import "./pages/anxiety.css";

const App = () => {
  return (
    <Router>
      <Routes>
       
        
        <Route
          path="*"
          element={
            <Dashboard>
              <Routes>
                <Route path="/chatbot" element={<Chatbot />} />
                <Route path="/anxiety" element={<Anxiety />} />
                <Route path="/anxiety-test" element={<AnxietyTest />} />
                <Route path="/depression" element={<Depression />} />
                <Route path="/depression-test" element={<DepressionTest />} />
                <Route path="/well-being" element={<WellBeing />} />
                <Route path="/well-being-test" element={<WellTest />} />
                <Route path="/eating-disorder" element={<EatingDisorder />} />
                <Route path="/eating-disorder-test" element={<EatingTest />} />
              </Routes>
            </Dashboard>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
