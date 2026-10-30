"use client";
import { useEffect, useState } from "react";
import { LoadingIndicator } from "./loading-indicator";

type Price = { id: string; unit_price: string | number; unit: string; recorded_on: string; supplier_name: string };
type Result = { product: { name: string; unit: string | null }; prices: Price[] };
const money = (value: string | number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 10 }).format(Number(value));

export function ProductComparison({ productId }: { productId: string }) {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/produtos?id=${encodeURIComponent(productId)}`, { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error("Não foi possível carregar os detalhes do produto.");
      setResult(await response.json());
    }).catch(reason => { if (!controller.signal.aborted) setError(reason.message); });
    return () => controller.abort();
  }, [productId]);
  if (error) return <p className="form-error" role="alert">{error}</p>;
  if (!result) return <LoadingIndicator label="Carregando detalhes do produto…" />;
  const prices = result.prices;
  return <div className="product-comparison"><header><p className="eyebrow">HISTÓRICO DE PREÇOS</p><h1>Comparação de preços</h1><p>{result.product.name}</p></header>
    <section className="comparison-product"><span>PRODUTO</span><h2>{result.product.name}</h2><p>Unidade: {result.product.unit ?? "não informada"}</p></section>
    {prices.length ? <><div className="comparison-stats"><div><span>Menor preço registrado</span><strong>{money(prices[0].unit_price)}</strong><small>{prices[0].supplier_name}</small></div><div><span>Maior preço registrado</span><strong>{money(prices[prices.length - 1].unit_price)}</strong><small>{prices[prices.length - 1].supplier_name}</small></div></div>
      <section className="comparison-records"><h2>Registros por fornecedor</h2><p>Últimos 90 dias · até 100 registros, do menor para o maior preço.</p><ul>{prices.map(price => <li key={price.id}><div><strong>{price.supplier_name}</strong><span>{price.recorded_on.split("-").reverse().join("/")}</span></div><strong>{money(price.unit_price)} <small>/ {price.unit}</small></strong></li>)}</ul></section></> : <div className="empty-state"><strong>Ainda não há preços para comparar</strong><p>Não encontramos registros na mesma unidade nos últimos 90 dias.</p></div>}
    <p className="comparison-note">Preços históricos não garantem oferta ou disponibilidade atual. Frete e condições de pagamento não estão incluídos.</p>
  </div>;
}
