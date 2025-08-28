import React from "react";
import "../componentDesign/About.css";

const About = () => {
  const conditions = [
    { name: "Anxiety", link: "https://www.mayoclinic.org/diseases-conditions/anxiety/symptoms-causes/syc-20350961" },
    { name: "Depression", link: "https://www.mayoclinic.org/diseases-conditions/depression/symptoms-causes/syc-20356007" },
    { name: "Eating Disorder", link: "https://www.nimh.nih.gov/health/topics/eating-disorders" },
    { name: "Suicide", link: "https://www.who.int/news-room/fact-sheets/detail/suicide" },
    { name: "Tardive Dyskinesia", link: "https://www.mayoclinic.org/diseases-conditions/tardive-dyskinesia/symptoms-causes/syc-20354588" },
    { name: "Trauma & PTSD", link: "https://www.nimh.nih.gov/health/topics/post-traumatic-stress-disorder-ptsd" },
    { name: "Well-Being", link: "https://www.psychologytoday.com/us/blog/click-here-for-happiness/201901/what-is-well-being-definition-types-and-well-being-skills" },
  ];

  return (
    <div className="abouts">
      {/* Mental Health Conditions */}
      <div className="about-conditions">
        <h2>Learn About Mental Health Conditions</h2>
        <ul className="conditions-list">
          {conditions.map((condition, index) => (
            <li key={index}>
              <a
                href={condition.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                {condition.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default About;
