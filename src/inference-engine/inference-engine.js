/**
 * InferenceEngine class for advanced text generation and sampling.
 * Supports greedy search, temperature scaling, Top-K sampling, Top-P (nucleus) sampling,
 * repetition penalties, beam search, and stop sequence termination.
 */
class InferenceEngine {
  /**
   * Generates text from a LanguageModel given a prompt and sampling options.
   * @param {Object} model - LanguageModel instance
   * @param {string} prompt - Prompt or context string to start from
   * @param {number} [length=10] - Number of tokens to generate
   * @param {Object} [options={}] - Sampling configuration options
   * @param {number} [options.temperature=1.0] - Temperature for sampling (>0)
   * @param {number} [options.topK=0] - Top-K candidates cutoff (0 = disabled)
   * @param {number} [options.topP=1.0] - Top-P / nucleus sampling threshold (1.0 = disabled)
   * @param {number} [options.repetitionPenalty=1.0] - Repetition penalty (>1.0 reduces repeating tokens)
   * @param {string[]} [options.stopSequences=[]] - Array of strings that halt generation
   * @return {string} - Generated continuation text
   */
  static generate(model, prompt, length = 10, options = {}) {
    if (!model || typeof prompt !== "string") return prompt || "";

    const opts = {
      temperature: 1.0,
      topK: 0,
      topP: 1.0,
      repetitionPenalty: 1.0,
      stopSequences: [],
      ...options,
    };

    let generated = prompt;
    const generatedTokens = model.tokenize ? model.tokenize(prompt) : prompt.split(/\s+/);
    const maxN = model.maxN || 5;

    for (let i = 0; i < length; i++) {
      const currentPrefix = generatedTokens.slice(-maxN).join(" ");
      const candidates = model.predict ? model.predict(currentPrefix, 20) : [];

      if (!candidates || candidates.length === 0) break;

      const nextToken = InferenceEngine._sampleToken(
        model,
        currentPrefix,
        candidates,
        generatedTokens,
        opts
      );

      if (!nextToken) break;

      generatedTokens.push(nextToken);
      generated += " " + nextToken;

      // Check stop sequences
      if (opts.stopSequences.some((seq) => generated.endsWith(seq))) {
        break;
      }
    }

    return generated;
  }

  /**
   * Generates text using Beam Search decoding.
   * @param {Object} model - LanguageModel instance
   * @param {string} prompt - Initial prompt text
   * @param {number} [length=5] - Number of tokens to generate
   * @param {number} [beamWidth=3] - Number of parallel beams to maintain
   * @return {string} - Top beam text
   */
  static beamSearch(model, prompt, length = 5, beamWidth = 3) {
    if (!model || typeof prompt !== "string") return prompt || "";

    const initialTokens = model.tokenize ? model.tokenize(prompt) : prompt.split(/\s+/);
    const maxN = model.maxN || 5;

    let beams = [{ tokens: [...initialTokens], text: prompt, score: 0.0 }];

    for (let step = 0; step < length; step++) {
      const candidates = [];

      for (const beam of beams) {
        const prefix = beam.tokens.slice(-maxN).join(" ");
        const predictions = model.predict ? model.predict(prefix, beamWidth * 2) : [];

        for (const word of predictions) {
          const prob = model.getProbability ? model.getProbability(word, prefix) : 0.1;
          const logProb = Math.log(prob > 0 ? prob : Number.EPSILON);
          candidates.push({
            tokens: [...beam.tokens, word],
            text: beam.text + " " + word,
            score: beam.score + logProb,
          });
        }
      }

      if (candidates.length === 0) break;

      candidates.sort((a, b) => b.score - a.score);
      beams = candidates.slice(0, beamWidth);
    }

    return beams.length > 0 ? beams[0].text : prompt;
  }

  /**
   * Generates text token by token using an async generator for streaming.
   * @param {Object} model - LanguageModel instance
   * @param {string} prompt - Initial prompt text
   * @param {number} [length=10] - Number of tokens to generate
   * @param {Object} [options={}] - Sampling configuration options
   * @yields {string} - Individual generated tokens
   * @return {AsyncGenerator<string>} - Async generator yielding tokens
   */
  static *generateStream(model, prompt, length = 10, options = {}) {
    if (!model || typeof prompt !== "string") {
      yield prompt;
      return;
    }

    const opts = {
      temperature: 1.0,
      topK: 0,
      topP: 1.0,
      repetitionPenalty: 1.0,
      stopSequences: [],
      ...options,
    };

    const generatedTokens = model.tokenize ? model.tokenize(prompt) : prompt.split(/\s+/);
    const maxN = model.maxN || 5;

    yield prompt;

    for (let i = 0; i < length; i++) {
      const currentPrefix = generatedTokens.slice(-maxN).join(" ");
      const candidates = model.predict ? model.predict(currentPrefix, 20) : [];

      if (!candidates || candidates.length === 0) break;

      const nextToken = InferenceEngine._sampleToken(
        model,
        currentPrefix,
        candidates,
        generatedTokens,
        opts
      );

      if (!nextToken) break;

      generatedTokens.push(nextToken);
      yield nextToken;

      const currentText = generatedTokens.slice(-maxN).join(" ");
      if (opts.stopSequences.some((seq) => currentText.endsWith(seq))) {
        break;
      }
    }
  }

  static _sampleToken(model, context, candidates, history, opts) {
    if (candidates.length === 1 || opts.temperature <= 0.01) {
      return candidates[0];
    }

    // Assign probability scores to candidates
    let scored = candidates.map((word) => {
      let prob = model.getProbability ? model.getProbability(word, context) : 1 / candidates.length;
      if (prob <= 0) prob = 0.001;

      // Apply repetition penalty
      if (opts.repetitionPenalty > 1.0 && history.includes(word)) {
        prob /= opts.repetitionPenalty;
      }

      return { word, prob };
    });

    // Normalize probabilities to sum to 1.0 before Top-K/Top-P
    const totalProb = scored.reduce((acc, item) => acc + item.prob, 0);
    if (totalProb > 0) {
      scored = scored.map((item) => ({
        word: item.word,
        prob: item.prob / totalProb,
      }));
    }

    // Apply Temperature scaling
    scored = scored.map((item) => ({
      word: item.word,
      score: Math.exp(Math.log(Math.max(item.prob, Number.EPSILON)) / opts.temperature),
    }));

    // Re-normalize after temperature
    const totalScore = scored.reduce((acc, item) => acc + item.score, 0);
    if (totalScore > 0) {
      scored = scored.map((item) => ({
        word: item.word,
        score: item.score / totalScore,
      }));
    }

    // Sort descending
    scored.sort((a, b) => b.score - a.score);

    // Apply Top-K cutoff
    if (opts.topK > 0 && opts.topK < scored.length) {
      scored = scored.slice(0, opts.topK);
    }

    // Apply Top-P (Nucleus) cutoff
    if (opts.topP < 1.0 && opts.topP > 0) {
      let cumulativeProb = 0;
      const nucleus = [];

      for (const item of scored) {
        nucleus.push(item);
        cumulativeProb += item.score;
        if (cumulativeProb >= opts.topP) break;
      }
      scored = nucleus;
    }

    // Sample from candidate distribution
    const finalTotal = scored.reduce((acc, item) => acc + item.score, 0);
    const rand = Math.random() * finalTotal;

    let cumulative = 0;
    for (const item of scored) {
      cumulative += item.score;
      if (rand <= cumulative) {
        return item.word;
      }
    }

    return scored[0].word;
  }
}

module.exports = InferenceEngine;
