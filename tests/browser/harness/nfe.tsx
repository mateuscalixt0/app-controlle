import { createRoot } from 'react-dom/client';
import { NfeImport } from '../../../src/components/nfe-import';
import { NfeAssociationReview } from '../../../src/components/nfe-association-review';
import '../../../src/app/globals.css';

const products = [
  { id: 'product-1', name: 'TORNEIRA PRETA PIA 1/2', unit: 'UN' },
  { id: 'product-2', name: 'TORNEIRA PRETA PIA 3/4', unit: 'UN' },
];
const pendingSources = [{
  id: 'source-1', description_original: 'TORN P/PIA PRETO 1/2', description_normalized: 'TORNEIRA PARA PIA PRETO 1/2',
  gtin: '7894900011517', ncm: '84818019', reference_unit: 'UN', supplier_id: 'supplier-1',
}];
const confirmedSources = [{ id: 'source-2', description_original: 'TORNEIRA PIA PRETA 1/2', product_name: products[0].name, supplier_name: 'Fornecedor Alfa' }];

createRoot(document.getElementById('root')!).render(<main style={{ maxWidth: 760, padding: 16, margin: 'auto' }}>
  <NfeImport />
  <NfeAssociationReview pendingSources={pendingSources} confirmedSources={confirmedSources} confirmedGtins={{ '7894900011517': 'product-1' }} conflictingGtins={[]} rejectedPairs={[]} suppliers={{ 'supplier-1': 'Fornecedor Beta' }} products={products} />
</main>);
