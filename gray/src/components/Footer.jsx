import React from "react";
import "../componentDesign/HeaderFooter.css";

const Footer = ({ setShowHelp, setShowAbout, setShowDevs }) => {
  const conditions = [
    { name: "Depression", link: "https://www.mayoclinic.org/diseases-conditions/depression/symptoms-causes/syc-20356007" },
    { name: "Anxiety", link: "https://www.mayoclinic.org/diseases-conditions/anxiety/symptoms-causes/syc-20350961" },
    { name: "Eating Disorders", link: "https://www.nimh.nih.gov/health/topics/eating-disorders" },
    { name: "Big Five Inventory", link: "https://www.verywellmind.com/the-big-five-personality-dimensions-2795422" },
    { name: "Well-Being", link: "https://www.psychologytoday.com/us/blog/click-here-for-happiness/201901/what-is-well-being-definition-types-and-well-being-skills" },
  ];

  return (
    <div className="footer">
      <div className="help-signup">
        <h2>Sign Up for Help</h2>
        <p style={{ color: "var(--text-dark)" }}>
          Learn about opportunities to help change the conversation around mental health.
        </p>
        <form className="help-form">
          <label>FIRST NAME</label>
          <input type="text" />

          <label>LAST NAME</label>
          <input type="text" />

          <label>EMAIL</label>
          <input type="email" />

          <label>PHONE NUMBER (OPTIONAL)</label>
          <input type="tel" />

          <button type="submit" className="submit-button-help">
            SUBMIT
          </button>
        </form>
      </div>

      <div className="footer-content">
        <div className="footer-links">
          <div>
            <h4>Learn about Mental Health Conditions</h4>
            <ul>
              {conditions.map((condition, index) => (
                <li key={index}>
                  <a
                    href={condition.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="condition-link"
                  >
                    {condition.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      <p>&copy; 2025 Mental Health Dashboard. All rights reserved.</p>
    </div>
  );
};

export default Footer;
