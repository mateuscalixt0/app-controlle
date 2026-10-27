import { describe, expect, it } from "vitest";
import { normalizeProductDescription, parseNfeXml, validGtin } from "../src/lib/nfe-parser";

function xml(root = "NFe", prefix = "", includeKey = true) {
  const tag = (name: string) => `${prefix}${name}`;
  const ns = prefix ? `xmlns:${prefix.slice(0, -1)}="urn:nfe"` : "";
  return `<${tag(root)} ${ns}><${tag("infNFe")}${includeKey ? ` Id="NFe${"1".repeat(44)}"` : ""}><${tag("ide")}><${tag("mod")}>55</${tag("mod")}><${tag("serie")}>1</${tag("serie")}><${tag("nNF")}>42</${tag("nNF")}><${tag("dhEmi")}>2026-10-26T10:00:00-03:00</${tag("dhEmi")}></${tag("ide")}><${tag("emit")}><${tag("xNome")}>Loja Beta</${tag("xNome")}><${tag("CNPJ")}>12345678000195</${tag("CNPJ")}></${tag("emit")}><${tag("det")} nItem="7"><${tag("prod")}><${tag("cProd")}>TORN-12</${tag("cProd")}><${tag("cEAN")}>7894900011517</${tag("cEAN")}><${tag("xProd")}>TORN P/PIA PRETO 1/2</${tag("xProd")}><${tag("NCM")}>84818019</${tag("NCM")}><${tag("qCom")}>2.0000</${tag("qCom")}><${tag("uCom")}>UN</${tag("uCom")}><${tag("vUnCom")}>39.9000000000</${tag("vUnCom") }><${tag("vProd")}>79.80</${tag("vProd")}></${tag("prod")}></${tag("det")}><${tag("total")}><${tag("ICMSTot")}><${tag("vNF")}>79.80</${tag("vNF")}></${tag("ICMSTot")}></${tag("total")}></${tag(root)}>`;
}

describe("parseNfeXml", () => {
  it("lê uma NF-e sem declaração XML e preserva identificadores e valores", () => {
    const parsed = parseNfeXml(xml());
    expect(parsed.invoiceNumber).toBe("42");
    expect(parsed.items[0]).toMatchObject({ number: 7, supplierCode: "TORN-12", gtin: "7894900011517", ncm: "84818019", quantity: "2.0000", unitPrice: "39.9000000000", total: "79.80" });
    expect(parsed.items[0].name).toBe("TORN P/PIA PRETO 1/2");
    expect(parsed.items[0].normalizedName).toContain("TORNEIRA");
  });

  it("lê tags com namespace e rejeita DTD", () => {
    expect(parseNfeXml(xml("NFe", "n:")).items).toHaveLength(1);
    expect(() => parseNfeXml(`<!DOCTYPE x>${xml()}`)).toThrow(/estrutura não permitida/i);
  });

  it("aceita nota sem chave de acesso quando os outros dados estão presentes", () => {
    expect(parseNfeXml(xml("NFe", "", false)).accessKey).toBeNull();
  });

  it("normaliza texto sem apagar medidas e valida GTIN", () => {
    expect(normalizeProductDescription("Torn p/ pia 1/2")).toBe("TORNEIRA PARA PIA 1/2");
    expect(normalizeProductDescription("TORNEIRA PIA COR PRETA MEIA")).toBe("TORNEIRA PIA COR PRETO 1/2");
    expect(validGtin("7894900011517")).toBe(true);
    expect(validGtin("ABC7894900011517")).toBe(false);
    expect(validGtin("SEM GTIN")).toBe(false);
    expect(validGtin("7894900011518")).toBe(false);
  });
});
