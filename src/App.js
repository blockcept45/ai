import React, { useState, useEffect, useRef } from "react";

function App() {
  const [qaData, setQaData] = useState([]);
  const [index, setIndex] = useState(0);
  const [messages, setMessages] = useState([]);
  const [voiceText, setVoiceText] = useState("");
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  // 🎤 INIT SPEECH
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SR) {
      alert("Use Chrome browser");
      return;
    }

    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = true;

    recognitionRef.current = rec;
  }, []);

  // 🌐 FETCH API
  useEffect(() => {
    fetch("https://raw.githubusercontent.com/blockcept45/ai-hr/refs/heads/main/main1.json")
      .then((res) => res.json())
      .then((data) => {
        setQaData(data);

        if (data.length > 0) {
          const msg = "Hi 👋 First question: " + data[0].question;
          setMessages([{ text: msg, sender: "bot" }]);
          speak(msg);
        }
      })
      .catch(() => alert("API load failed"));
  }, []);

  // 🔊 SPEAK
  const speak = (text) => {
    const u = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  // 🧠 SCORE FUNCTION (KEYWORD BASED)
  const getScore = (keywords, user) => {
    if (!keywords || !Array.isArray(keywords)) return 0;

    const clean = (str) =>
      str.toLowerCase().replace(/[^\w\s]/g, "");

    const userWords = clean(user).split(" ");

    let matchCount = 0;

    keywords.forEach((word) => {
      if (userWords.includes(word.toLowerCase())) {
        matchCount++;
      }
    });

    return Math.round((matchCount / keywords.length) * 100);
  };

  // 🎤 START LISTEN
  const startListening = () => {
    const rec = recognitionRef.current;
    if (!rec) return;

    setIsListening(true);
    setVoiceText("🎤 Listening...");

    rec.start();

    rec.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      setVoiceText(text);
    };

    rec.onend = () => setIsListening(false);

    rec.onerror = () => {
      setIsListening(false);
      setVoiceText("❌ Try again");
    };
  };

  // ✅ SUBMIT ANSWER
  const submitAnswer = () => {
    if (!voiceText.trim() || qaData.length === 0) return;

    const current = qaData[index];

    let newMessages = [...messages, { text: voiceText, sender: "user" }];

    const percent = getScore(current.keywords, voiceText);

    let feedback = "";

    if (percent >= 80) {
      feedback = "🔥 Excellent!";
      speak("Excellent answer");
    } else if (percent >= 50) {
      feedback = "👍 Good answer";
      speak("Good answer");
    } else if (percent >= 20) {
      feedback = "🙂 Partial answer";
      speak("Partial answer");
    } else {
      feedback = "❌ Weak answer";
      speak("Weak answer");
    }

    newMessages.push({
      text: `Score: ${percent}% → ${feedback}`,
      sender: "bot"
    });

    // NEXT QUESTION
    if (index < qaData.length - 1) {
      const nextQ = qaData[index + 1].question;
      newMessages.push({ text: nextQ, sender: "bot" });
      speak("Next question. " + nextQ);
      setIndex(index + 1);
    } else {
      const finalMsg = "🎉 Interview Finished";
      newMessages.push({ text: finalMsg, sender: "bot" });
      speak(finalMsg);
    }

    setMessages(newMessages);
    setVoiceText("");
  };

  // 🔽 AUTO SCROLL
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 💬 CHAT UI
  const ChatMessage = ({ text, sender }) => (
    <div
      style={{
        display: "flex",
        justifyContent: sender === "user" ? "flex-end" : "flex-start",
        margin: "10px"
      }}
    >
      <div
        style={{
          background: sender === "user" ? "#2563eb" : "#1e293b",
          color: "#fff",
          padding: "10px",
          borderRadius: "10px",
          maxWidth: "70%"
        }}
      >
        {text}
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>🤖 AI Voice Interview</h2>

      {/* CHAT */}
      <div style={styles.chat}>
        {messages.map((m, i) => (
          <ChatMessage key={i} text={m.text} sender={m.sender} />
        ))}
        <div ref={chatEndRef}></div>
      </div>

      {/* VOICE UI */}
      <div style={styles.bottom}>
        <div style={styles.voiceBox}>
          {voiceText || "🎤 Tap mic and speak..."}
        </div>

        <div style={styles.controls}>
          <button
            onClick={startListening}
            style={{
              ...styles.mic,
              ...(isListening ? styles.micActive : {})
            }}
          >
            🎤
          </button>

          <button onClick={submitAnswer} style={styles.submit}>
            ✅
          </button>
        </div>
      </div>
    </div>
  );
}

// 🎨 STYLE
const styles = {
  container: {
    maxWidth: "500px",
    margin: "auto",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#0f172a",
    color: "#fff"
  },
  header: { textAlign: "center", padding: "15px" },
  chat: { flex: 1, overflowY: "auto" },
  bottom: { padding: "10px", borderTop: "1px solid #333" },
  voiceBox: {
    background: "#1e293b",
    padding: "10px",
    borderRadius: "10px",
    marginBottom: "10px"
  },
  controls: { display: "flex", justifyContent: "space-between" },
  mic: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    fontSize: "20px"
  },
  micActive: {
    background: "#ef4444",
    animation: "pulse 1s infinite"
  },
  submit: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "#22c55e",
    color: "#fff",
    border: "none",
    fontSize: "20px"
  }
};

export default App;