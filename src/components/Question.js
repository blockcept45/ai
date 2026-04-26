import React from "react";

function Question({ question, index }) {
  return (
    <div>
      <h2>Question {index + 1}</h2>
      <h3>{question}</h3>
    </div>
  );
}

export default Question;