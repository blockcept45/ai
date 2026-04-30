import React, { useState, useEffect, useRef } from "react";

function App() {
  const [qaData, setQaData] = useState([]);
  const [index, setIndex] = useState(0);
  const [messages, setMessages] = useState([]);
  const [voiceText, setVoiceText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [started, setStarted] = useState(false);

  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  // 🎤 INIT SPEECH RECOGNITION
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SR) {
      alert("Use Chrome browser");
      return;
    }

    const rec = new SR();
    rec.lang = "en-IN";
    rec.continuous = false;
    rec.interimResults = false;

    rec.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setVoiceText(text);
    };

    rec.onend = () => setIsListening(false);

    rec.onerror = () => setIsListening(false);

    recognitionRef.current = rec;
  }, []);

  // 🌐 FETCH API (QUESTION + ANSWER)
  useEffect(() => {
    fetch("https://raw.githubusercontent.com/blockcept45/ai-hr/refs/heads/main/main1.json")
      .then((res) => res.json())
      .then((data) => {
        setQaData(data);

        const firstQ = "Hi 👋 " + data[0].question;
        setMessages([{ text: firstQ, sender: "bot" }]);
      })
      .catch(() => alert("API load failed"));
  }, []);

  // 🔊 SPEECH QUEUE (NO CUTTING)
  const speakQueue = (texts) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    texts.forEach((text, i) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-IN";

      setTimeout(() => {
        window.speechSynthesis.speak(u);
      }, i * 2200); // delay per sentence
    });
  };

  // ▶ START INTERVIEW
  const startInterview = () => {
    if (qaData.length === 0) return;

    setStarted(true);

    const unlock = new SpeechSynthesisUtterance("");
    window.speechSynthesis.speak(unlock);

    setTimeout(() => {
      speakQueue(["Hi", qaData[0].question]);
    }, 300);
  };

  // 🎤 START MIC
  const startListening = () => {
    if (!started) {
      alert("Click Start Interview first");
      return;
    }

    const rec = recognitionRef.current;
    if (!rec) return;

    setVoiceText("");
    setIsListening(true);

    setTimeout(() => rec.start(), 200);
  };

  // 🧠 SCORE FUNCTION
  const getScore = (keywords, user) => {
    if (!keywords) return 0;

    const words = user.toLowerCase().split(" ");
    let match = 0;

    keywords.forEach((k) => {
      if (words.includes(k.toLowerCase())) match++;
    });

    return Math.round((match / keywords.length) * 100);
  };

  // ✅ SUBMIT ANSWER
  const submitAnswer = () => {
    if (!voiceText.trim() || qaData.length === 0) return;

    const current = qaData[index];
    const correctAnswer = current.answer || "Good answer.";

    let newMessages = [
      ...messages,
      { text: voiceText, sender: "user" }
    ];

    const score = getScore(current.keywords, voiceText);

    let feedback = "";
    if (score >= 80) feedback = "Excellent";
    else if (score >= 50) feedback = "Good";
    else if (score >= 20) feedback = "Partial";
    else feedback = "Weak";

    const resultMsg = `Score: ${score}% → ${feedback}`;

    // SHOW IN CHAT
    newMessages.push({ text: resultMsg, sender: "bot" });
    newMessages.push({
      text: "💡 Sample Answer: " + correctAnswer,
      sender: "bot"
    });

    setMessages(newMessages);

    // 🔊 SPEAK ALL
    speakQueue([
      "You said",
      voiceText,
      resultMsg,
      "Here is a better answer",
      correctAnswer
    ]);

    // ⏭ NEXT QUESTION
    if (index < qaData.length - 1) {
      const nextQ = qaData[index + 1].question;

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { text: nextQ, sender: "bot" }
        ]);
        speakQueue([nextQ]);
      }, 7000);

      setIndex(index + 1);
    } else {
      setTimeout(() => {
        const finalMsg = "🎉 Interview Finished";
        setMessages((prev) => [
          ...prev,
          { text: finalMsg, sender: "bot" }
        ]);
        speakQueue([finalMsg]);
      }, 7000);
    }

    setVoiceText("");
  };

  // 🔽 AUTO SCROLL
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="app-container d-flex flex-column">

      {/* HEADER */}
      <div className="app-header">
        <h5>🤖 AI Voice Interview</h5>
      </div>

      {/* START */}
      {!started && (
        <div className="text-center p-3">
          <button className="btn btn-success" onClick={startInterview}>
            ▶ Start Interview
          </button>
        </div>
      )}

      {/* CHAT */}
      <div className="chat-container">
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.sender}`}>
            {m.text}
          </div>
        ))}
        <div ref={chatEndRef}></div>
      </div>

      {/* BOTTOM */}
      <div className="bottom-bar">
        <div className="voice-preview">
          {voiceText || "🎤 Speak your answer..."}
        </div>

        <div className="d-flex justify-content-between mt-2">
          <button
            onClick={startListening}
            disabled={!started}
            className={`mic-btn ${isListening ? "listening" : ""}`}
          >
            🎤
          </button>

          <button
            onClick={submitAnswer}
            disabled={!started}
            className="submit-btn"
          >
            ✅
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;