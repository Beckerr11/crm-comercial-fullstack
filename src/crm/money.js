export function parseMoney(value) {
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(String(value).trim()))
    throw new Error("Informe o valor no formato 1.250,00.");
  const normalized = String(value).trim().replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized))
    throw new Error("Informe o valor no formato 1.250,00.");
  const [whole, fraction = ""] = normalized.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}
