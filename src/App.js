import React, { useState, useEffect, useRef } from "react";

function App() {
  const [qaData, setQaData] = useState([]);
  const [index, setIndex] = useState(0);
  const [messages, setMessages] = useState([]);
  const [voiceText, setVoiceText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [started, setStarted] = useState(false);

  const [waitingChoice, setWaitingChoice] = useState(false);
  const [lastAnswer, setLastAnswer] = useState(null);

  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  // 🎤 SPEECH RECOGNITION
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

  // 🌐 FETCH QUESTIONS
  useEffect(() => {
    fetch("https://raw.githubusercontent.com/blockcept45/ai-hr/refs/heads/main/main1.json")
      .then((res) => res.json())
      .then((data) => {
        setQaData(data);
        setMessages([{ text: "Hi 👋 " + data[0].question, sender: "bot" }]);
      })
      .catch(() => alert("API load failed"));
  }, []);

  // 🔊 SPEAK
  const speakQueue = (texts) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    texts.forEach((text, i) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-IN";

      setTimeout(() => {
        window.speechSynthesis.speak(u);
      }, i * 2000);
    });
  };

  // ▶ START
  const startInterview = () => {
    if (qaData.length === 0) return;

    setStarted(true);

    const unlock = new SpeechSynthesisUtterance("");
    window.speechSynthesis.speak(unlock);

    setTimeout(() => {
      speakQueue(["Hi", qaData[0].question]);
    }, 300);
  };

  // 🎤 MIC
  const startListening = () => {
    if (!started || waitingChoice) {
      alert("Finish current step first");
      return;
    }

    const rec = recognitionRef.current;
    if (!rec) return;

    setVoiceText("");
    setIsListening(true);

    setTimeout(() => rec.start(), 200);
  };

  // 🧠 CUSTOM SCORE LOGIC
  const getScore = (keywords, user) => {
    if (!keywords || keywords.length === 0) return 0;

    const words = user.toLowerCase().split(/\s+/);

    let match = 0;

    keywords.forEach((k) => {
      if (words.some(w => w.includes(k.toLowerCase()))) {
        match++;
      }
    });

    // ❌ NO MATCH
    if (match === 0) return 0;

    // 🔥 HIGH MATCH (6+)
    if (match >= 6) {
      const high = [70, 80, 90];
      return high[Math.floor(Math.random() * high.length)];
    }

    // 👍 MEDIUM MATCH (3–5)
    if (match >= 3) {
      return Math.floor(Math.random() * 20) + 50; // 50–69
    }

    // 🙂 LOW MATCH (1–2)
    return Math.floor(Math.random() * 20) + 40; // 40–59
  };

  // ✅ SUBMIT
  const submitAnswer = () => {
    if (!voiceText.trim() || qaData.length === 0) return;

    const current = qaData[index];
    const correctAnswer = current.answer || "Good answer.";

    const score = getScore(current.keywords, voiceText);

    let feedback = "";
    if (score >= 80) feedback = "Excellent";
    else if (score >= 60) feedback = "Good";
    else if (score >= 40) feedback = "Average";
    else if (score > 0) feedback = "Weak";
    else feedback = "Very Poor";

    const resultMsg = `Score: ${score}% → ${feedback}`;

    setMessages((prev) => [
      ...prev,
      { text: voiceText, sender: "user" },
      { text: resultMsg, sender: "bot" },
      { text: "Can I explain how you can answer better?", sender: "bot" }
    ]);

    setLastAnswer({
      user: voiceText,
      correct: correctAnswer
    });

    setWaitingChoice(true);

    speakQueue([
      "You said",
      voiceText,
      resultMsg,
      "Can I explain how you can answer better?"
    ]);

    setVoiceText("");
  };

  // 👍 YES
  const handleYes = () => {
    if (!lastAnswer) return;

    const explainMsg = "💡 Sample Answer: " + lastAnswer.correct;

    setMessages((prev) => [
      ...prev,
      { text: explainMsg, sender: "bot" }
    ]);

    speakQueue(["Here is a better answer", lastAnswer.correct]);

    setWaitingChoice(false);
    moveNextQuestion();
  };

  // ❌ NO
  const handleNo = () => {
    setWaitingChoice(false);
    moveNextQuestion();
  };

  // ⏭ NEXT
  const moveNextQuestion = () => {
    if (index < qaData.length - 1) {
      const nextQ = qaData[index + 1].question;

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { text: nextQ, sender: "bot" }
        ]);
        speakQueue([nextQ]);
      }, 2000);

      setIndex((prev) => prev + 1);
    } else {
      const finalMsg = "🎉 Interview Finished";

      setMessages((prev) => [
        ...prev,
        { text: finalMsg, sender: "bot" }
      ]);

      speakQueue([finalMsg]);
    }
  };

  // 🔽 AUTO SCROLL
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="app-container d-flex flex-column">

      <div className="app-header">
        <h5>🤖 AI Voice Interview</h5>
      </div>

      {!started && (
        <div className="text-center p-3">
          <button className="btn btn-success" onClick={startInterview}>
            ▶ Start Interview
          </button>
        </div>
      )}

      <div className="chat-container">
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.sender}`}>
            {m.text}
          </div>
        ))}
        <div ref={chatEndRef}></div>
      </div>

      <div className="bottom-bar">
        <div className="voice-preview">
          {voiceText || "🎤 Speak your answer..."}
        </div>

        <div className="d-flex justify-content-between mt-2">
          <button
            onClick={startListening}
            disabled={!started || waitingChoice}
            className={`mic-btn ${isListening ? "listening" : ""}`}
          >
            🎤
          </button>

          <button
            onClick={submitAnswer}
            disabled={!started || waitingChoice}
            className="submit-btn"
          >
            ✅
          </button>
        </div>

        {waitingChoice && (
          <div className="text-center mt-3">
            <button className="btn btn-success me-2" onClick={handleYes}>
              👍 Yes
            </button>
            <button className="btn btn-danger" onClick={handleNo}>
              ❌ No
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;