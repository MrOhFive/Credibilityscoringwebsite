const clickbaitWords = [
  "shocking",
  "secret",
  "exposed",
  "insane",
  "breaking",
  "they don't want you to know",
  "you won't believe",
  "ultimate truth",
];

const emotionalWords = [
  "terrible",
  "horrible",
  "evil",
  "corrupt",
  "disaster",
  "outrageous",
  "miracle",
  "destroyed",

  // reflective / subjective phrases
  "for me",
  "i believe",
  "i think",
  "i feel",
  "i saw",
  "i had to",
  "in my opinion",
  "personally",
];

const citationPatterns = [
  ".gov",
  ".edu",
  "according to",
  "study",
  "research",
  "source",
  "reported by",
  "data shows",
];

export function analyzeText(text) {
  const sentenceRegex = /[^.!?]+[.!?]+[\])'"`’”]*\s*|.+/g;

  const matches = text.match(sentenceRegex) || [];

  const lowerText = text.toLowerCase();

  /*
    =========================
    CHUNK ANALYSIS
    =========================
  */

  const chunks = matches.map((sentence, i) => {
    const lowerSentence = sentence.toLowerCase();

    let flagged = false;
    let reason = "";

    clickbaitWords.forEach((word) => {
      if (lowerSentence.includes(word)) {
        flagged = true;
        reason = "Sensationalized wording detected";
      }
    });

    emotionalWords.forEach((word) => {
      if (lowerSentence.includes(word)) {
        flagged = true;
        reason = "Subjective or emotional wording detected";
      }
    });

    return {
      id: `chunk-${i}`,
      text: sentence.trim(),
      flagged,
      reason,
    };
  });

  const references = [];

  /*
    =========================
    SENSATIONALISM
    =========================
  */

  let sensationalism = 10;

  const foundClickbait = [];

  clickbaitWords.forEach((word) => {
    if (lowerText.includes(word)) {
      sensationalism -= 2;
      foundClickbait.push(word);
    }
  });

  const capsWords = text.match(/\b[A-Z]{4,}\b/g) || [];

  if (capsWords.length > 3) {
    sensationalism -= 2;
  }

  if (text.includes("!!!")) {
    sensationalism -= 1;
  }

  sensationalism = Math.max(0, sensationalism);

  /*
    =========================
    CITATIONS
    =========================
  */

  let citations = 0;

  const foundCitations = [];

  citationPatterns.forEach((pattern) => {
    if (lowerText.includes(pattern)) {
      citations += 2;
      foundCitations.push(pattern);
    }
  });

  citations = Math.min(10, citations);

  /*
    =========================
    EMOTIONAL LANGUAGE
    =========================
  */

  let emotionalLanguage = 10;

  const foundEmotionalWords = [];

  emotionalWords.forEach((word) => {
    if (lowerText.includes(word)) {
      emotionalLanguage -= 1;
      foundEmotionalWords.push(word);
    }
  });

  emotionalLanguage = Math.max(0, emotionalLanguage);

  /*
    =========================
    WRITING QUALITY
    =========================
  */

  let writingQuality = 8;

  if (text.length < 100) {
    writingQuality -= 2;
  }

  if (capsWords.length > 5) {
    writingQuality -= 2;
  }

  writingQuality = Math.max(0, writingQuality);

  /*
    =========================
    TRANSPARENCY
    =========================
  */

  let transparency = 5;

  if (lowerText.includes("author")) {
    transparency += 2;
  }

  if (lowerText.includes("contact")) {
    transparency += 2;
  }

  if (lowerText.includes("organization")) {
    transparency += 1;
  }

  transparency = Math.min(10, transparency);

  /*
    =========================
    FINAL WEIGHTED SCORE
    =========================
  */

  const finalScoreRaw =
    citations * 0.30 +
    transparency * 0.25 +
    sensationalism * 0.20 +
    emotionalLanguage * 0.15 +
    writingQuality * 0.10;

  const finalScore = Math.round(finalScoreRaw);

  /*
    =========================
    REFERENCES / FINDINGS
    =========================
  */

  if (foundClickbait.length > 0) {
    references.push({
      id: "ref-sensationalism",
      chunkIds: chunks
        .filter((chunk) => chunk.reason.includes("Sensationalized"))
        .map((chunk) => chunk.id),

      title: "Sensationalized Language",

      explanation: `Detected potentially sensational wording including: ${foundClickbait.join(", ")}`,

      type: "warning",
    });
  }

  if (foundEmotionalWords.length > 0) {
    references.push({
      id: "ref-emotional",

      chunkIds: chunks
        .filter((chunk) => chunk.reason.includes("Subjective"))
        .map((chunk) => chunk.id),

      title: "Subjective Language",

      explanation: `Detected subjective or emotionally persuasive wording including: ${foundEmotionalWords.join(", ")}`,

      type: "neutral",
    });
  }

  if (foundCitations.length > 0) {
    references.push({
      id: "ref-citations",

      chunkIds: chunks.map((chunk) => chunk.id),

      title: "Supporting References Detected",

      explanation: `Detected credibility indicators such as: ${foundCitations.join(", ")}`,

      type: "positive",
    });
  }

  if (citations <= 2) {
    references.push({
      id: "ref-low-citations",

      chunkIds: chunks.map((chunk) => chunk.id),

      title: "Limited Supporting Evidence",

      explanation:
        "The text contains few verifiable references, citations, or supporting sources.",

      type: "warning",
    });
  }

  if (writingQuality >= 7) {
    references.push({
      id: "ref-writing-quality",

      chunkIds: chunks.map((chunk) => chunk.id),

      title: "Strong Writing Structure",

      explanation:
        "The text demonstrates organized sentence structure and readable formatting.",

      type: "positive",
    });
  }

  if (references.length === 0) {
    references.push({
      id: "ref-balanced",

      chunkIds: chunks.map((chunk) => chunk.id),

      title: "Balanced Language",

      explanation:
        "The text generally avoids sensationalized wording and maintains a relatively neutral tone.",

      type: "positive",
    });
  }

  /*
    =========================
    SUMMARY
    =========================
  */

  let summary = "";

  if (finalScore >= 8) {
    summary =
      "This text demonstrates strong credibility indicators including balanced language and supporting references.";
  } else if (finalScore >= 5) {
    summary =
      "This text contains mixed credibility signals. While some factual structure exists, emotionally persuasive or unsupported language was also detected.";
  } else {
    summary =
      "This text shows several indicators commonly associated with low credibility content, including sensationalized or weakly supported claims.";
  }

  return {
    overallScore: finalScore,

    categoryScores: {
      citations,
      transparency,
      sensationalism,
      emotionalLanguage,
      writingQuality,
    },

    summary,

    chunks,

    references,
  };
}