const add = require('./add');

describe('add function', () => {
  test('correctly adds two positive numbers', () => {
    expect(add(2, 3)).toBe(5);  // このテストは失敗します
  });
});
