'use client';
import { useEffect, useState } from 'react';
import { LoadingIndicator } from './loading-indicator';
type Price = { id: string; unit_price: string | number; unit: string; recorded_on: string; supplier_name: string };
export function ProductPriceReport({ productId }: { productId?: string | null }) {
  const [result,setResult] = useState<{ prices: Price[] } | null>(null);
  const [error,setError] = useState('');
  useEffect(() => {
    if (!productId) return;
    const controller = new AbortController();
    fetch(`/api/produtos?id=${encodeURIComponent(productId)}`, { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Não foi possível carregar o histórico de preços.');
      setResult(await response.json());
    }).catch(reason => { if (!controller.signal.aborted) setError(reason.message); });
    return () => controller.abort();
  },[productId]);
  return <section className="price-highlight"><h3>Menor preço registrado</h3>
    {!productId ? <p>Esta falta foi anotada sem selecionar um produto do catálogo.</p> : error ? <p role="alert" className="form-error">{error}</p> : !result ? <LoadingIndicator label="Carregando preços…" /> : !result.prices.length ? <p>Este produto ainda não tem preços registrados na mesma unidade nos últimos 90 dias.</p> : <><strong className="price-highlight-value">{new Intl.NumberFormat('pt-BR',{ style:'currency',currency:'BRL',maximumFractionDigits:10 }).format(Number(result.prices[0].unit_price))} <small>/ {result.prices[0].unit}</small></strong><p>{result.prices[0].supplier_name} · {result.prices[0].recorded_on.split('-').reverse().join('/')}</p></>}
    <p className="helper-text">Preços históricos não garantem oferta ou disponibilidade atual. Frete e condições de pagamento não estão incluídos.</p>
  </section>;
}
