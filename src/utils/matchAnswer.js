const matchAnswer = (keywords, user) => {
  const clean = (str) =>
    str.toLowerCase().replace(/[^\w\s]/g, "");

  const userWords = clean(user).split(" ");

  let matchCount = 0;

  keywords.forEach((word) => {
    if (userWords.includes(word.toLowerCase())) {
      matchCount++;
    }
  });

  const score = matchCount / keywords.length;

  return score >= 0.4; // 🔥 40% match = correct
};