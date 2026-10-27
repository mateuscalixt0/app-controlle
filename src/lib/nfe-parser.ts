export type NfeItem = {
  number: number;
  supplierCode: string;
  name: string;
  normalizedName: string;
  gtin: string | null;
  ncm: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  total: string;
};
export type ParsedNfe = { accessKey: string | null; supplierName: string; supplierCnpj: string; invoiceNumber: string; series: string; model: string; issuedOn: string; items: NfeItem[]; total: string };

const MAX_XML_BYTES = 2 * 1024 * 1024;
const forbidden = /<!DOCTYPE|<!ENTITY|\bSYSTEM\b|\bPUBLIC\b/i;
const q = "(?:[\\w.-]+:)?";
const colors: Record<string, string> = { PRETA: "PRETO", BRANCA: "BRANCO", CINZA: "CINZA", AMARELA: "AMARELO", VERMELHA: "VERMELHO", AZUL: "AZUL", VERDE: "VERDE" };

function text(block: string, tag: string) {
  const match = block.match(new RegExp("<" + q + tag + "(?:\\s[^>]*)?>([\\s\\S]*?)<\\/" + q + tag + "\\s*>", "i"));
  if (!match) return "";
  const value = match[1].trim();
  if (/(?:&(?!amp;|lt;|gt;|quot;|apos;)|&#)/i.test(value)) throw new Error("O XML contém entidades não permitidas.");
  return value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}

function block(source: string, tag: string) {
  return source.match(new RegExp("<" + q + tag + "\\b[^>]*>([\\s\\S]*?)<\\/" + q + tag + "\\s*>", "i"))?.[1] ?? "";
}

function decimal(value: string, field: string, scale = 4) {
  if (!new RegExp("^\\d+(?:\\.\\d{1," + scale + "})?$").test(value)) throw new Error("Campo inválido no XML: " + field + ".");
  return value;
}

export function normalizeProductDescription(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase()
    .replace(/\bPVC\s+SOLD\b/g, "PVC SOLDAVEL")
    .replace(/\bTORN\b/g, "TORNEIRA")
    .replace(/\bTUB\b/g, "TUBO")
    .replace(/\bSOLD\b/g, "SOLDAVEL")
    .replace(/\bBLACK\b/g, "PRETO")
    .replace(/\b(PRETA|BRANCA|CINZA|AMARELA|VERMELHA|AZUL|VERDE)\b/g, (_match, color: string) => colors[color])
    .replace(/\bP\s*\/\s*/g, "PARA ")
    .replace(/(\d+(?:[.,]\d+)?)\s*MM\b/g, "$1 MILIMETROS")
    .replace(/(\d+(?:[.,]\d+)?)\s*(?:MT|M)\b/g, "$1 METROS")
    .replace(/\bMEIA\s*$/g, "1/2")
    .replace(/\s+/g, " ").trim();
}

export function validGtin(value: string) {
  const gtin = value.trim();
  if (!/^\d+$/.test(gtin)) return false;
  if (![8, 12, 13, 14].includes(gtin.length) || /^0+$/.test(gtin)) return false;
  let sum = 0;
  for (let i = gtin.length - 2, weight = 3; i >= 0; i--, weight = weight === 3 ? 1 : 3) sum += Number(gtin[i]) * weight;
  return (10 - (sum % 10)) % 10 === Number(gtin.at(-1));
}

export function parseNfeXml(xml: string): ParsedNfe {
  if (!xml || new TextEncoder().encode(xml).byteLength > MAX_XML_BYTES) throw new Error("O XML deve ter no máximo 2 MB.");
  if (forbidden.test(xml) || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(xml) || (xml.match(/</g) ?? []).length > 8000) {
    throw new Error("O XML contém uma estrutura não permitida.");
  }
  if (!/^\s*(?:<\?xml[\s\S]*?\?>\s*)?<(?:[\w.-]+:)?(?:nfeProc|NFe)\b/i.test(xml)) throw new Error("Arquivo XML de NF-e inválido.");
  const inf = xml.match(new RegExp("<" + q + "infNFe\\b([^>]*)>", "i"))?.[1] ?? "";
  const accessKey = inf.match(/\bId\s*=\s*["']NFe(\d{44})["']/i)?.[1]
    ?? text(block(xml, "infProt"), "chNFe").match(/^\d{44}$/)?.[0]
    ?? null;
  const emit = block(xml, "emit");
  const ide = block(xml, "ide");
  const supplierName = text(emit, "xNome");
  const supplierCnpj = text(emit, "CNPJ").replace(/\D/g, "");
  const invoiceNumber = text(ide, "nNF");
  const series = text(ide, "serie");
  const model = text(ide, "mod");
  const issuedRaw = text(ide, "dhEmi") || text(ide, "dEmi");
  const issuedOn = issuedRaw.slice(0, 10);
  if (!supplierName || !/^\d{14}$/.test(supplierCnpj) || !/^\d{1,9}$/.test(invoiceNumber) || !/^\d{1,3}$/.test(series) || model !== "55" || !/^\d{4}-\d{2}-\d{2}$/.test(issuedOn)) {
    throw new Error("O XML não contém emitente, CNPJ, número, série, modelo ou emissão válidos.");
  }
  const itemMatches = [...xml.matchAll(new RegExp("<" + q + "det\\b([^>]*)>([\\s\\S]*?)<\\/" + q + "det\\s*>", "gi"))];
  if (!itemMatches.length || itemMatches.length > 1000) throw new Error("O XML não contém itens válidos.");
  const items = itemMatches.map((match, index) => {
    const prod = block(match[2], "prod");
    const name = text(prod, "xProd");
    const quantity = decimal(text(prod, "qCom"), "quantidade");
    const unit = text(prod, "uCom");
    const unitPrice = decimal(text(prod, "vUnCom"), "preço unitário", 10);
    const total = decimal(text(prod, "vProd"), "total do item", 2);
    const rawGtins = [text(prod, "cEAN"), text(prod, "cEANTrib")];
    const gtin = rawGtins.find(validGtin)?.trim() ?? null;
    if (!name || !unit) throw new Error("Há item sem descrição ou unidade.");
    return { number: Number(match[1].match(/\bnItem=["'](\d+)["']/i)?.[1] ?? index + 1), supplierCode: text(prod, "cProd").slice(0, 100), name: name.slice(0, 200), normalizedName: normalizeProductDescription(name).slice(0, 240), gtin, ncm: text(prod, "NCM").slice(0, 8), quantity, unit: unit.slice(0, 80), unitPrice, total };
  });
  const totalBlock = block(xml, "ICMSTot");
  const total = decimal(text(totalBlock, "vNF"), "total da nota", 2);
  return { accessKey, supplierName: supplierName.slice(0, 160), supplierCnpj, invoiceNumber, series, model, issuedOn, items, total };
}
