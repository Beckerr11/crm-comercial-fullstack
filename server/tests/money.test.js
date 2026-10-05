import test from "node:test";
import assert from "node:assert/strict";
import { parseMoney } from "../../src/crm/money.js";
test("Brazilian currency input preserves cents and rejects ambiguous grouping", () => {
  assert.equal(parseMoney("19,99"), 1999);
  assert.equal(parseMoney("1.250,40"), 125040);
  assert.equal(parseMoney("0,01"), 1);
  for (const input of [
    "19.99",
    "1.2",
    "-4,00",
    "12,345",
    "Infinity",
    "1e5",
    "",
  ])
    assert.throws(() => parseMoney(input));
});
