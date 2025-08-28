import { useState, useEffect } from 'react';
import '../chatbot/Chatbot.css';

function Chatbot({ severeAlert }) {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: "Hi! I'm your mental health chatbot. How can I support you today?" }
  ]);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (severeAlert) {
      const alertMessage = {
        sender: 'bot',
        text: "⚠️ I see that your test result indicates **Severe Anxiety**. It's important to prioritize your well-being and consider talking to a mental health professional or trusted person. I am here if you wish to share how you feel or need resources."
      };
      setMessages(prev => [...prev, alertMessage]);
    }
  }, [severeAlert]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const newMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, newMessage]);

    const userInput = input.toLowerCase();

    const topics = [
      {
        keywords: ['depression', 'depressed', 'hopeless', 'depress'],
        response: `Depression is a common mental health condition that causes a persistent feeling of sadness and changes in how you think, sleep, eat and act. It is treatable—usually with therapy, medication, or both. Seek help if you notice these symptoms:\n
1. Persistent sadness\n
2. Loss of interest\n
3. Sleep changes\n
4. Fatigue\n
5. Feelings of worthlessness\n
6. Difficulty concentrating\n
7. Thoughts of death or suicide.\n
If you or someone you know is experiencing these, please seek help from a mental health professional.`
      },
      {
        keywords: ['anxiety', 'anxious', 'panic'],
        response: `Anxiety is your body’s natural response to stress, but it can become overwhelming. Symptoms may include:\n
1. Rapid heartbeat\n
2. Shortness of breath\n
3. Excessive worry\n
4. Restlessness\n
5. Difficulty concentrating\n
If anxiety affects your daily life, consider speaking to a professional.`
      },
      {
        keywords: ['bigfive', 'big five', 'bfi', 'personality test'],
        response: `The Big Five Inventory (BFI) measures personality traits:\n
1. Openness\n
2. Conscientiousness\n
3. Extraversion\n
4. Agreeableness\n
5. Neuroticism\n
It's used to understand individual differences in personality and behavior.`
      },
      {
        keywords: ['wellbeing', 'well-being', 'happiness', 'mental health', 'quality of life'],
        response: `Well-being includes emotional, psychological, and social health. Prioritize rest, relationships, and healthy habits to improve quality of life.`
      }
    ];

    let botReply = "I'm here to help. Could you tell me more about how you're feeling?";

    for (const topic of topics) {
      if (topic.keywords.some(keyword => userInput.includes(keyword))) {
        botReply = topic.response;
        break;
      }
    }

    setTimeout(() => {
      setMessages(prev => [...prev, { sender: 'bot', text: botReply }]);
    }, 500);

    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  const renderMessage = (msg, i) => (
    <div key={i} className={`chat-message ${msg.sender}`}>
      {msg.text.split('\n').map((line, index) => (
        <p key={index}>{line.trim()}</p>
      ))}
    </div>
  );

  return (
    <div className="chat-container">
      <div className="chat-box">
        {messages.map((msg, i) => renderMessage(msg, i))}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default Chatbot;
