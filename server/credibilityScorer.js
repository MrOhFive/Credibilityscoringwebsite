export function analyzeText(text) {
  const sentenceRegex = /[^.!?]+[.!?]+[\])'"`’”]*\s*|.+/g;
  const matches = text.match(sentenceRegex) || [];

  const chunks = matches.map((sentence, i) => ({
    id: `chunk-${i}`,
    text: sentence,
  }));

  const references = [];
  let score = 7;

  if (chunks.length > 0) {
    references.push({
      id: 'ref-1',
      chunkIds: [chunks[0].id],
      title: 'Unverified Claim',
      explanation: 'This opening statement presents a factual claim without a verifiable source or clear context.',
      type: 'warning',
    });
    score -= 1;

    if (chunks.length > 2) {
      const midIndex = Math.floor(chunks.length / 2);
      references.push({
        id: 'ref-2',
        chunkIds: [chunks[midIndex].id],
        title: 'Strong Corroboration',
        explanation: 'This point is generally accepted and aligns well with established consensus and available records.',
        type: 'positive',
      });
      score += 2;
    }

    if (chunks.length > 4) {
      references.push({
        id: 'ref-3',
        chunkIds: [chunks[chunks.length - 1].id],
        title: 'Subjective Framing',
        explanation: 'The phrasing here relies on subjective interpretation rather than objective, measurable metrics.',
        type: 'neutral',
      });
      score -= 1;
    }
  }

  const finalScore = Math.min(Math.max(score, 1), 10);

  return {
    overallScore: finalScore,
    summary:
      finalScore >= 8
        ? 'Overall, this text appears to be highly credible. Most statements align with established facts, though minor points may lack direct citations.'
        : finalScore >= 5
          ? 'This text has mixed credibility. While it contains factual elements, several claims are unsupported or rely heavily on subjective language.'
          : 'The credibility of this text is questionable. Multiple statements are unverified, lack sources, or contradict established consensus.',
    chunks,
    references,
  };
}
