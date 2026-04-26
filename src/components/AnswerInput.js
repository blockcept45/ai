import React from "react";

function AnswerInput({ value, onChange }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Type your answer"
      style={{ padding: "10px", width: "300px" }}
    />
  );
}

export default AnswerInput;