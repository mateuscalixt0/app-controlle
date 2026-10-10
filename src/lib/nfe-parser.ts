export type NfeItem = { name: string; quantity: string; unit: string; unitPrice: string; total: string };
export type ParsedNfe = { accessKey: string; supplierName: string; supplierCnpj: string; invoiceNumber: string; issuedOn: string; items: NfeItem[]; total: string };

const MAX_XML_BYTES = 2 * 1024 * 1024;
const forbidden = /<!DOCTYPE|<!ENTITY|\bSYSTEM\b|\bPUBLIC\b/i;

function text(block: string, tag: string) {
  const match = block.match(new RegExp("<" + tag + "(?:\\s[^>]*)?>([\\s\\S]*?)<\\/" + tag + ">", "i"));
  if (!match) return "";
  const value = match[1].trim();
  if (/(?:&(?!amp;|lt;|gt;|quot;|apos;)|&#)/i.test(value)) throw new Error("O XML contém entidades não permitidas.");
  return value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}

function decimal(value: string, field: string) {
  if (!/^\d+(?:\.\d{1,4})?$/.test(value)) throw new Error("Campo inválido no XML: " + field + ".");
  return value;
}

export function parseNfeXml(xml: string): ParsedNfe {
  if (!xml || new TextEncoder().encode(xml).byteLength > MAX_XML_BYTES) throw new Error("O XML deve ter no máximo 2 MB.");
  if (forbidden.test(xml) || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(xml) || (xml.match(/</g) ?? []).length > 8000) {
    throw new Error("O XML contém uma estrutura não permitida.");
  }
  if (!/^\s*<\?xml[\s\S]*?(?:<nfeProc\b|<NFe\b)/i.test(xml)) throw new Error("Arquivo XML de NF-e inválido.");
  const inf = xml.match(/<infNFe\b([^>]*)>/i)?.[1] ?? "";
  const accessKey = (inf.match(/\bId=["']NFe(\d{44})["']/i)?.[1] ?? "");
  if (!accessKey) throw new Error("A chave de acesso de 44 dígitos não foi encontrada.");
  const emit = xml.match(/<emit\b[^>]*>([\s\S]*?)<\/emit>/i)?.[1] ?? "";
  const ide = xml.match(/<ide\b[^>]*>([\s\S]*?)<\/ide>/i)?.[1] ?? "";
  const supplierName = text(emit, "xNome");
  const supplierCnpj = text(emit, "CNPJ").replace(/\D/g, "");
  const invoiceNumber = text(ide, "nNF");
  const issuedRaw = text(ide, "dhEmi") || text(ide, "dEmi");
  const issuedOn = issuedRaw.slice(0, 10);
  if (!supplierName || !/^\d{14}$/.test(supplierCnpj) || !/^\d{1,9}$/.test(invoiceNumber) || !/^\d{4}-\d{2}-\d{2}$/.test(issuedOn)) {
    throw new Error("O XML não contém emitente, CNPJ, número ou emissão válidos.");
  }
  const itemBlocks = [...xml.matchAll(/<det\b[^>]*>([\s\S]*?)<\/det>/gi)].map((match) => match[1]);
  if (!itemBlocks.length || itemBlocks.length > 1000) throw new Error("O XML não contém itens válidos.");
  const items = itemBlocks.map((block) => {
    const prod = block.match(/<prod\b[^>]*>([\s\S]*?)<\/prod>/i)?.[1] ?? "";
    const name = text(prod, "xProd");
    const quantity = decimal(text(prod, "qCom"), "quantidade");
    const unit = text(prod, "uCom");
    const unitPrice = decimal(text(prod, "vUnCom"), "preço unitário");
    const total = decimal(text(prod, "vProd"), "total do item");
    if (!name || !unit) throw new Error("Há item sem descrição ou unidade.");
    return { name: name.slice(0, 200), quantity, unit: unit.slice(0, 80), unitPrice, total };
  });
  const totalBlock = xml.match(/<ICMSTot\b[^>]*>([\s\S]*?)<\/ICMSTot>/i)?.[1] ?? "";
  const total = totalBlock ? decimal(text(totalBlock, "vNF"), "total da nota") : items.reduce((sum, item) => sum + Number(item.total), 0).toFixed(2);
  return { accessKey, supplierName: supplierName.slice(0, 160), supplierCnpj, invoiceNumber, issuedOn, items, total };
}