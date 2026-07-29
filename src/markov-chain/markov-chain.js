const Counter = require("../counter/counter");

/**
 * MarkovChain class for modeling state transitions and generating paths.
 */
class MarkovChain {
  /**
   * Constructs a MarkovChain instance.
   * @param {number} [order=1] - The order N of the Markov Chain
   */
  constructor(order = 1) {
    this.order = Math.max(1, order);
    // Map of state string -> Counter of next state tokens
    this.transitions = new Map();
  }

  /**
   * Trains the Markov Chain on an array of token sequences.
   * @param {string[][]} sequences - Array of token arrays
   */
  train(sequences) {
    if (!Array.isArray(sequences)) return;

    for (const seq of sequences) {
      if (!Array.isArray(seq) || seq.length <= this.order) continue;

      for (let i = 0; i <= seq.length - this.order - 1; i++) {
        const state = seq.slice(i, i + this.order).join(" ");
        const nextState = seq[i + this.order];

        if (!this.transitions.has(state)) {
          this.transitions.set(state, new Counter());
        }
        this.transitions.get(state).increment(nextState);
      }
    }
  }

  /**
   * Returns the normalized transition probability matrix as a nested JavaScript object.
   * @return {Object} - Map of state -> { nextState: probability }
   */
  getTransitionMatrix() {
    const matrix = {};
    for (const [state, counter] of this.transitions) {
      matrix[state] = {};
      const total = counter.total();
      if (total > 0) {
        for (const [nextState, count] of counter.counter) {
          matrix[state][nextState] = count / total;
        }
      }
    }
    return matrix;
  }

  /**
   * Retrieves next state transition probabilities for a given state.
   * @param {string} state - The current state string
   * @return {Object} - Object mapping next states to probabilities
   */
  getNextStateProbability(state) {
    const counter = this.transitions.get(state);
    if (!counter) return {};

    const probabilities = {};
    const total = counter.total();
    if (total > 0) {
      for (const [nextState, count] of counter.counter) {
        probabilities[nextState] = count / total;
      }
    }
    return probabilities;
  }

  /**
   * Generates a sequence of states/tokens starting from an initial state.
   * @param {string} startState - Initial state string
   * @param {number} [steps=10] - Number of transitions to generate
   * @return {string[]} - Generated sequence of tokens including start tokens
   */
  generatePath(startState, steps = 10) {
    let tokens = startState ? startState.split(" ") : [];
    let currentState = tokens.slice(-this.order).join(" ");

    for (let i = 0; i < steps; i++) {
      const probs = this.getNextStateProbability(currentState);
      const nextStates = Object.keys(probs);

      if (nextStates.length === 0) break;

      // Sample based on probability distribution
      const rand = Math.random();
      let cumulative = 0;
      let chosen = nextStates[0];

      for (const [nextState, prob] of Object.entries(probs)) {
        cumulative += prob;
        if (rand <= cumulative) {
          chosen = nextState;
          break;
        }
      }

      tokens.push(chosen);
      currentState = tokens.slice(-this.order).join(" ");
    }

    return tokens;
  }
}

module.exports = MarkovChain;
