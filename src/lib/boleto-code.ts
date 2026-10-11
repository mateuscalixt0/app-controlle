export type BoletoCodeResult = {
  type: "bancário" | "concessionária";
  line: string;
  barcode: string;
  amount: string;
  dueDate: string;
  valid: boolean;
  error?: string;
};

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function lineToBarcode(line: string) {
  return line.slice(0, 4) + line[32] + line.slice(33, 47) + line.slice(4, 9) + line.slice(10, 20) + line.slice(21, 31);
}

function barcodeDigitIsValid(barcode: string) {
  const body = barcode.slice(0, 4) + barcode.slice(5);
  const sum = [...body].reduce((total, value, index) => total + Number(value) * (2 + index % 8), 0);
  let digit = 11 - (sum % 11);
  if (digit === 0 || digit === 10 || digit === 11) digit = 1;
  return digit === Number(barcode[4]);
}

function dateFromFactor(factor: number, today = new Date()) {
  if (!factor) return "";
  const base = new Date(Date.UTC(1997, 9, 7));
  const candidates = [0, 1, 2, 3].map((cycle) => {
    const date = new Date(base);
    date.setUTCDate(date.getUTCDate() + factor + 9000 * cycle);
    return date;
  });
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const closest = candidates.reduce((current, candidate) => Math.abs(candidate.getTime() - todayUtc) < Math.abs(current.getTime() - todayUtc) ? candidate : current);
  return `${closest.getUTCFullYear()}-${String(closest.getUTCMonth() + 1).padStart(2, "0")}-${String(closest.getUTCDate()).padStart(2, "0")}`;
}

function amountFromDigits(value: string) {
  const cents = Number.parseInt(value, 10);
  return cents > 0 ? (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "";
}

export function parseBoletoCode(value: string): BoletoCodeResult {
  const code = digits(value);
  if (code.length === 48 && code.startsWith("8")) {
    const barcode = [code.slice(0, 11), code.slice(12, 23), code.slice(24, 35), code.slice(36, 47)].join("");
    return {
      type: "concessionária",
      line: code,
      barcode,
      amount: amountFromDigits(barcode.slice(4, 15)),
      dueDate: "",
      valid: true,
    };
  }

  if (code.length !== 44 && code.length !== 47) {
    return { type: "bancário", line: code, barcode: "", amount: "", dueDate: "", valid: false, error: "Digite ou leia 44, 47 ou 48 dígitos." };
  }

  const barcode = code.length === 47 ? lineToBarcode(code) : code;
  const valid = barcodeDigitIsValid(barcode);
  return {
    type: "bancário",
    line: code,
    barcode,
    amount: amountFromDigits(barcode.slice(9, 19)),
    dueDate: dateFromFactor(Number.parseInt(barcode.slice(5, 9), 10)),
    valid,
    error: valid ? undefined : "O dígito verificador não confere. Confira o código.",
  };
}
