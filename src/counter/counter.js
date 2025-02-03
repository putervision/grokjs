class Counter {
  constructor(initial = []) {
    this.counter = new Map();

    if (Array.isArray(initial)) {
      for (const item of initial) {
        this.increment(item);
      }
    } else if (typeof initial === "object" && initial !== null) {
      for (const [item, count] of Object.entries(initial)) {
        this.increment(item, count);
      }
    }
  }

  /**
   * Increments the count for an item by one or by a specified amount.
   * @param {*} item - The item to count
   * @param {number} [n=1] - The amount to increment by
   * @throws {Error} If increment is not a non-negative number
   */
  increment(item, n = 1) {
    if (typeof n !== "number" || n < 0)
      throw new Error("Increment must be a non-negative number");
    this.counter.set(item, (this.counter.get(item) || 0) + n);
  }

  /**
   * Decrements the count for an item by one or by a specified amount.
   * If the count becomes zero or less, it removes the item.
   * @param {*} item - The item to decrement
   * @param {number} [n=1] - The amount to decrement by
   * @throws {Error} If decrement is not a non-negative number
   */
  decrement(item, n = 1) {
    if (typeof n !== "number" || n < 0)
      throw new Error("Decrement must be a non-negative number");
    let count = this.counter.get(item) || 0;
    count -= n;
    if (count > 0) {
      this.counter.set(item, count);
    } else {
      this.counter.delete(item);
    }
  }

  /**
   * Gets the count of the item.
   * @param {*} item - The item to get the count for
   * @return {number} - The count of the item, or 0 if not present
   */
  get(item) {
    return this.counter.get(item) || 0;
  }

  /**
   * Returns the total count of all items in the counter.
   * @return {number} - The total count
   */
  total() {
    return Array.from(this.counter.values()).reduce(
      (sum, count) => sum + count,
      0,
    );
  }

  /**
   * Returns the most common elements and their counts from the most common to the least.
   * If n is specified, return only the top n items.
   * @param {number} [n] - The number of items to return
   * @return {Array} - Array of [item, count] pairs
   */
  mostCommon(n) {
    return Array.from(this.counter.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, n);
  }

  /**
   * Returns an array of all items in the counter according to their counts.
   * @return {Array} - All items in the counter
   */
  elements() {
    let result = [];
    for (let [item, count] of this.counter) {
      result.push(...Array(count).fill(item));
    }
    return result;
  }

  /**
   * Returns a new Counter with counts from this Counter minus the other Counter.
   * @param {Counter} other - Another Counter to subtract from this one
   * @return {Counter} - A new Counter with subtracted counts
   */
  subtract(other) {
    let result = new Counter();
    for (let [item, count] of this.counter) {
      result.increment(item, count);
    }
    for (let [item, count] of other.counter) {
      result.decrement(item, count);
    }
    return result;
  }

  /**
   * Returns a string representation of the counter, similar to Python's Counter repr.
   * @return {string} - String representation of the counter
   */
  toString() {
    return `Counter({${Array.from(this.counter)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ")}})`;
  }
}

module.exports = Counter;
