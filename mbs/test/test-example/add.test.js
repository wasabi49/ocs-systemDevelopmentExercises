import add from "./add";

describe('add function', () => {
  test('correctly adds two positive numbers (example1)', () => {
    expect(add(2, 3)).toBe(5);  // このテストは失敗します
  });
});
