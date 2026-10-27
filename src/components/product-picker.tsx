'use client';
import { useEffect, useId, useState } from 'react';
type Product = { id: string; name: string; unit: string | null };
export function ProductPicker() {
  const id = useId();
  const [query,setQuery] = useState('');
  const [selected,setSelected] = useState<Product | null>(null);
  const [products,setProducts] = useState<Product[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true); setError('');
      try {
        const response = await fetch(`/api/produtos?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Não foi possível buscar produtos. Tente digitar novamente.');
        const data = await response.json();
        setProducts(data.products);
      } catch (reason) { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Falha ao buscar produtos.'); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    },250);
    return () => { clearTimeout(timer); controller.abort(); };
  },[query]);
  return <div>
    <input type="hidden" name="product_id" value={selected?.id ?? ''} />
    <label htmlFor={id}>Produto cadastrado</label>
    <input id={id} name="product" required maxLength={200} value={query} onChange={e => { setQuery(e.target.value); setSelected(null); setProducts([]); setLoading(true); }} placeholder="Digite para buscar no catálogo" autoComplete="off" />
    {selected ? <p className="helper-text" role="status">Selecionado: {selected.name}{selected.unit ? ` · ${selected.unit}` : ''}. O histórico de preços ficará disponível nos detalhes da falta.</p> : <>
      {loading && <p role="status">Buscando produtos…</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {!loading && !error && <div aria-label="Produtos encontrados">{products.map(p => <button type="button" className="secondary-action" key={p.id} onClick={() => { setSelected(p); setQuery(p.name); }}>{p.name}{p.unit ? ` · ${p.unit}` : ''}</button>)}<p className="helper-text">{products.length ? 'Selecione um produto para consultar seus preços. Refine a busca se ele não aparecer.' : 'Nenhum produto encontrado. Você pode anotar esse nome como uma nova falta, sem histórico de preços.'}</p></div>}
    </>}
  </div>;
}
