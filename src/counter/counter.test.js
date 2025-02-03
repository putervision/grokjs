const Counter = require("./counter");

describe("Counter", () => {
  let counter;

  beforeEach(() => {
    counter = new Counter(["a", "b", "a", "c", "b", "b"]);
  });

  test("constructor initializes counter correctly", () => {
    expect(counter.get("a")).toBe(2);
    expect(counter.get("b")).toBe(3);
    expect(counter.get("c")).toBe(1);
    expect(counter.get("d")).toBe(0);
  });

  test("increment increases count of existing item", () => {
    counter.increment("b");
    expect(counter.get("b")).toBe(4);
  });

  test("increment adds new item if not present", () => {
    counter.increment("d");
    expect(counter.get("d")).toBe(1);
  });

  test("increment with custom count", () => {
    counter.increment("a", 3);
    expect(counter.get("a")).toBe(5);
  });

  test("decrement decreases count of existing item", () => {
    counter.decrement("b");
    expect(counter.get("b")).toBe(2);
  });

  test("decrement removes item if count becomes zero", () => {
    counter.decrement("c");
    expect(counter.get("c")).toBe(0);
    expect(counter.toString()).not.toMatch(/c: 0/);
  });

  test("decrement with custom count", () => {
    counter.decrement("b", 2);
    expect(counter.get("b")).toBe(1);
  });

  test("get returns 0 for non-existent items", () => {
    expect(counter.get("z")).toBe(0);
  });

  test("total returns sum of all counts", () => {
    expect(counter.total()).toBe(6);
  });

  test("mostCommon returns items sorted by count", () => {
    expect(counter.mostCommon()).toEqual([
      ["b", 3],
      ["a", 2],
      ["c", 1],
    ]);
  });

  test("mostCommon with n parameter", () => {
    expect(counter.mostCommon(1)).toEqual([["b", 3]]);
  });

  test("elements returns all items according to their counts", () => {
    let elements = counter.elements();
    expect(elements).toHaveLength(6);
    expect(elements).toEqual(
      expect.arrayContaining(["a", "a", "b", "b", "b", "c"]),
    );
  });

  test("subtract creates a new counter with correct subtraction", () => {
    let anotherCounter = new Counter(["b", "b", "d"]);
    let subtractedCounter = counter.subtract(anotherCounter);
    expect(subtractedCounter.get("a")).toBe(2);
    expect(subtractedCounter.get("b")).toBe(1);
    expect(subtractedCounter.get("c")).toBe(1);
    expect(subtractedCounter.get("d")).toBe(0);
  });

  test("toString method provides correct string representation", () => {
    expect(counter.toString()).toBe("Counter({a: 2, b: 3, c: 1})");
  });
});
