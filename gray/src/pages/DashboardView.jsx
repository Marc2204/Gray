import React, { useState, useEffect, useRef } from "react";
import "../pageDesign/DashboardView.css";
import TestButtons from "../components/TestButtons";
import About from "../components/Abouts";
import Chatbot from "./Chatbot";
import PeerSupport from "./PeerSupport";

const DashboardView = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [isChatbotVisible, setIsChatbotVisible] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [showPeerSupport, setShowPeerSupport] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState("Community Support");
  const chatbotButtonRef = useRef(null);
  const testButtonsRef = useRef(null); // ref for TestButtons

  const supportCards = [
    { title: "Things to Try on Your Own", space: "Suggested Actions" },
    { title: "Connect with Others", space: "Community Support" },
    { title: "About Developers", space: "About Developers" },
    { title: "About System", space: "About System" },
  ];

  const openModal = (content) => {
    setModalContent(content);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
  };

  const toggleChatbot = () => {
    setIsChatbotVisible((prev) => !prev);
  };

  const scrollToTestButtons = () => {
    testButtonsRef.current?.scrollIntoView({ behavior: "smooth" });
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

  return (
    <div className="dashboard-container">
      {/* Section 1: Mental Health Importance */}
      <div className="dashboard-1">
        <div id="title1">
          <strong>Why is mental health important?</strong>
        </div>
        <div className="dashboard-description1">
          <p>
            Mental health is important because it affects every part of your life—how you think,
            feel, and act. It influences how you handle stress, relate to others, and make choices.
            When your mental health is in a good place, you're better able to:
          </p>
        </div>

        <div className="dashboard-buttons">
          <button onClick={scrollToTestButtons}>TAKE A MENTAL HEALTH TEST</button>
          <button onClick={() => setShowLearnMore((prev) => !prev)}>
            {showLearnMore ? "HIDE DETAILS" : "LEARN MORE ABOUT MENTAL HEALTH"}
          </button>
        </div>

        {showLearnMore && (
          <div className="learn-more-section">
            <p><strong>What is mental health?</strong></p>
            <p>
              Mental health refers to a person’s emotional, psychological, and social well-being.
              It influences how individuals think, feel, and behave, especially in response to stress,
              relationships, and daily challenges.
            </p>
            <p>
              There are many ways to support your mental health—like talking to a professional, staying connected,
              practicing mindfulness, and getting enough sleep.
            </p>
            <p>
              Remember: seeking help is a strength, not a weakness.
            </p>
          </div>
        )}
      </div>

      

      {/*Support Options */}
      <div className="dashboard-2">
        <p><strong>Find Support That Works for You</strong></p>
        <div className="dashboard-description2">
          <p>
            Discover ways to improve your mental wellness and connect with others.
          </p>
        </div>
        <div className="support-grid">
          {supportCards.map((card) => (
            <div
              key={card.title}
              className="support-card"
              onClick={() => {
                setSelectedSpace(card.space);
                setShowPeerSupport(true);
              }}
            >
              <h3>{card.title}</h3>
              <p>Click to explore {card.space}</p>
            </div>
          ))}
        </div>
      </div>


      
      
      {/* Peer Support Modal Section */}
      {showPeerSupport && (
        <div className="peer-support-section">
          <PeerSupport initialSpace={selectedSpace} />
          <button onClick={() => setShowPeerSupport(false)} className="close-modal-btn">
            close
          </button>
        </div>
      )}


      {/*Test Buttons */}
      <div ref={testButtonsRef}>
        <TestButtons />
      </div>

      
      {/* About Developer Section */}
      <About openModal={openModal} />

      {/* Developer Modal */}
      {isModalOpen && modalContent?.type === "developer" && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{modalContent.content.name}</h3>
            <p>{modalContent.content.bio}</p>
            <button onClick={closeModal} className="close-modal-btn">Close</button>
          </div>
        </div>
      )}

      {/* Chatbot Toggle Button */}
      <button
        onClick={toggleChatbot}
        ref={chatbotButtonRef}
        className="Chatbot-toggle-button"
      >
        {isChatbotVisible ? " 🤖 " : " 🤖 "}
      </button>

      {/* Chatbot Component */}
      {isChatbotVisible && (
        <div className="chatbot-wrapper">
          <Chatbot />
        </div>
      )}
    </div>
  );
};

export default DashboardView;
