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

function assessInputQuality(text) {
  const trimmed = text.trim();
  const words = trimmed.match(/[a-zA-Z]+(?:'[a-zA-Z]+)?/g) || [];
  const letterCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
  const nonWhitespaceCount = (trimmed.match(/\S/g) || []).length;
  const nonLetterRatio =
    nonWhitespaceCount === 0
      ? 1
      : (nonWhitespaceCount - letterCount) / nonWhitespaceCount;
  const hasLongSingleToken =
    words.length === 1 && words[0].length >= 10 && !trimmed.includes(" ");
  const hasRepeatedCharacters = /(.)\1{4,}/i.test(trimmed);
  const hasLongConsonantRun = /[bcdfghjklmnpqrstvwxyz]{5,}/i.test(trimmed);
  const hasMostlySymbols = nonLetterRatio > 0.45;
  const isVeryShort = words.length < 3;

  const reasons = [];

  if (isVeryShort) {
    reasons.push("too little meaningful text to evaluate");
  }

  if (
    hasLongSingleToken ||
    hasRepeatedCharacters ||
    hasLongConsonantRun ||
    hasMostlySymbols
  ) {
    reasons.push("the input looks like random characters, spam, or placeholder text");
  }

  return {
    isLowInformation:
      isVeryShort ||
      hasLongSingleToken ||
      hasRepeatedCharacters ||
      hasLongConsonantRun ||
      hasMostlySymbols,
    reasons,
  };
}

export function analyzeText(text) {
  const sentenceRegex = /[^.!?]+[.!?]+[\])'"`’”]*\s*|.+/g;

  const matches = text.match(sentenceRegex) || [];

  const lowerText = text.toLowerCase();
  const inputQuality = assessInputQuality(text);

  /*
    =========================
    CHUNK ANALYSIS
    =========================
  */

  const chunks = matches.map((sentence, i) => {
    const lowerSentence = sentence.toLowerCase();

    let flagged = false;
    let reason = "";

    if (inputQuality.isLowInformation) {
      flagged = true;
      reason = "Low-information or nonsensical input detected";
    }

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

    let highlightType = "";

    if (inputQuality.isLowInformation) {
      highlightType = "warning";
    }

    clickbaitWords.forEach((word) => {
      if (lowerSentence.includes(word)) {
        highlightType = "warning";
      }
    });

    emotionalWords.forEach((word) => {
      if (lowerSentence.includes(word)) {
        if (!highlightType) {
          highlightType = "neutral";
        }
      }
    });

    citationPatterns.forEach((word) => {
      if (lowerSentence.includes(word)) {
        if (!highlightType) {
          highlightType = "positive";
        }
      }
    });

    return {
      id: `chunk-${i}`,
      text: sentence.trim(),
      flagged,
      reason,
      highlightType,
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

  if (inputQuality.isLowInformation) {
    citations = 0;
    transparency = 0;
    sensationalism = Math.min(sensationalism, 2);
    emotionalLanguage = Math.min(emotionalLanguage, 4);
    writingQuality = 0;
  }

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

  const finalScore = Math.round(finalScoreRaw * 10);

  /*
    =========================
    REFERENCES / FINDINGS
    =========================
  */

  if (inputQuality.isLowInformation) {
    references.push({
      id: "ref-low-information",

      chunkIds: chunks.map((chunk) => chunk.id),

      title: "Low-Information Input",

      explanation: `The submitted text appears difficult to evaluate because it contains ${inputQuality.reasons.join(" and ")}.`,

      type: "warning",
    });
  }

  if (foundClickbait.length > 0) {
    references.push({
      id: "ref-sensationalism",
      chunkIds: chunks
        .filter((chunk) =>
          foundClickbait.some((word) => chunk.text.toLowerCase().includes(word))
        )
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
        .filter((chunk) =>
          foundEmotionalWords.some((word) =>
            chunk.text.toLowerCase().includes(word)
          )
        )
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

  if (inputQuality.isLowInformation) {
    summary =
      "This input does not contain enough meaningful language to produce a reliable credibility score. It looks like random text, spam, or placeholder content rather than a claim that can be evaluated.";
  } else if (finalScore >= 80) {
    summary =
      "This text demonstrates strong credibility indicators including balanced language and supporting references.";
  } else if (finalScore >= 50) {
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

    inputQuality,

    chunks,

    references,
  };
}

function getScoreLabel(score) {
  if (score >= 85) {
    return "Highly Credible";
  }

  if (score >= 70) {
    return "Mostly Credible";
  }

  if (score >= 50) {
    return "Mixed Credibility";
  }

  if (score >= 30) {
    return "Low Credibility";
  }

  return "Highly Questionable";
}

export function createFallbackExplanation(analysis) {
  if (analysis.inputQuality?.isLowInformation) {
    const reasons = analysis.inputQuality.reasons.join(" and ");

    return `This input cannot be scored like a normal credibility claim because it appears to contain ${reasons}. The low score reflects that there is not enough meaningful language, evidence, or factual structure to evaluate, so the best response is to enter a complete claim or passage rather than random text or spam-like content.`;
  }

  const categoryEntries = Object.entries(analysis.categoryScores);
  const strongestCategory = categoryEntries.reduce((best, current) =>
    current[1] > best[1] ? current : best
  );
  const weakestCategory = categoryEntries.reduce((worst, current) =>
    current[1] < worst[1] ? current : worst
  );

  const keyFindings = analysis.references
    .slice(0, 3)
    .map((reference) => reference.explanation)
    .join(" ");

  return `This report rates the text as ${getScoreLabel(analysis.overallScore).toLowerCase()} with an overall score of ${analysis.overallScore}/100. Its strongest signal is ${strongestCategory[0].replace(/([A-Z])/g, " $1").toLowerCase()} at ${strongestCategory[1]}/10, while the weakest signal is ${weakestCategory[0].replace(/([A-Z])/g, " $1").toLowerCase()} at ${weakestCategory[1]}/10. ${keyFindings}`;
}

function getTextFromOpenAIResponse(responseBody) {
  if (typeof responseBody.output_text === "string") {
    return responseBody.output_text.trim();
  }

  if (!Array.isArray(responseBody.output)) {
    return "";
  }

  return responseBody.output
    .flatMap((item) => (Array.isArray(item.content) ? item.content : []))
    .map((content) => content.text || "")
    .join("\n")
    .trim();
}

export async function generateExplanation(text, analysis) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      text: createFallbackExplanation(analysis),
      source: "local",
    };
  }

  const model = process.env.OPENAI_MODEL || "gpt-5.4-mini";
  const categorySummary = Object.entries(analysis.categoryScores)
    .map(([category, score]) => `${category}: ${score}/10`)
    .join("\n");
  const findingsSummary = analysis.references
    .map((reference) => `- ${reference.title}: ${reference.explanation}`)
    .join("\n");
  const inputQualitySummary = analysis.inputQuality?.isLowInformation
    ? `Input quality warning: ${analysis.inputQuality.reasons.join(" and ")}`
    : "Input quality warning: none";

  const prompt = `Create a concise credibility explanation for a user after their text has been scored.

Overall score: ${analysis.overallScore}/100 (${getScoreLabel(analysis.overallScore)})

${inputQualitySummary}

Category scores:
${categorySummary}

Findings:
${findingsSummary}

Existing summary:
${analysis.summary}

User text excerpt:
${text.slice(0, 3000)}

Write one short paragraph in plain language. If there is an input quality warning, clearly explain that the text looks like nonsense, spam, placeholder text, or too little meaningful language to evaluate. Otherwise, explain why the score landed where it did, mention the strongest and weakest signals, and avoid making claims about whether the real-world facts are true unless the scoring data supports it.`;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: prompt,
        max_output_tokens: 220,
      }),
    });

    const responseBody = await response.json();

    if (!response.ok) {
      throw new Error(responseBody.error?.message || "OpenAI request failed.");
    }

    const explanation = getTextFromOpenAIResponse(responseBody);

    if (!explanation) {
      throw new Error("OpenAI returned an empty explanation.");
    }

    return {
      text: explanation,
      source: "llm",
      model,
    };
  } catch (error) {
    console.error("Unable to generate LLM explanation:", error.message);

    return {
      text: createFallbackExplanation(analysis),
      source: "local",
      error: "The AI explanation service was unavailable, so a local explanation was generated.",
    };
  }
}
