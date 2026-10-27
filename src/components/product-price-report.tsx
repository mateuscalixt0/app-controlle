'use client';
import { useEffect, useState } from 'react';
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
  return <section className="comparison-empty"><h3>Relatório de preços</h3>
    {!productId ? <p>Esta falta foi anotada sem selecionar um produto do catálogo.</p> : error ? <p role="alert" className="form-error">{error}</p> : !result ? <p role="status">Carregando preços…</p> : !result.prices.length ? <p>Este produto ainda não tem preços registrados na mesma unidade nos últimos 90 dias.</p> : <><p>Últimos 90 dias · até 100 registros, do menor para o maior preço unitário.</p><ul>{result.prices.map((price,index) => <li key={price.id}><strong>{new Intl.NumberFormat('pt-BR',{ style:'currency',currency:'BRL',maximumFractionDigits:10 }).format(Number(price.unit_price))} / {price.unit}</strong>{index === 0 ? ' · Menor preço registrado' : ''}<br />{price.supplier_name} · {price.recorded_on.split('-').reverse().join('/')}</li>)}</ul></>}
    <p className="helper-text">Preços históricos não garantem oferta ou disponibilidade atual. Frete e condições de pagamento não estão incluídos.</p>
  </section>;
}
