import { createRoot } from 'react-dom/client';
import { AppShell } from '../../../src/components/app-shell';
import { HomeDashboard } from '../../../src/components/home-dashboard';
import { BillCard } from '../../../src/components/bill-card';
import { MissingList } from '../../../src/components/missing-list-demo';
import { LoginView } from '../../../src/components/login-view';
import '../../../src/app/login/login.css';
import '../../../src/app/globals.css';
const bill = { id: 'fixture', supplier: 'Fornecedor de teste com nome extenso', description: 'Material de construção — exemplo para teste', amount: 123456, dueDate: '2026-10-20', code: '12345.67890 12345.678901 12345.678901 1 12345678901234', hasDocument: true, status: 'pending' as const };
const params = new URLSearchParams(location.search);
document.addEventListener('submit', (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || form.id !== 'missing-filters') return;
  event.preventDefault();
  const query = new URLSearchParams([...new FormData(form)].map(([key, value]) => [key, String(value)]));
  history.pushState(null, '', `/tests/browser/harness/design.html?path=/faltas&${query}`);
});
if (params.has('absent')) Object.assign(bill, {code:null,hasDocument:false});
const path = params.get('path');
async function mount() {
  const view = path === '/login' ? <LoginView erro="1" action={() => {}}/> : <AppShell>{path === '/boletos' ? <><h1>Seus boletos</h1><BillCard bill={bill}/></> : path === '/faltas' ? <><h1>Lista de faltas</h1><MissingList items={[{id:'test',product_name:'Cimento de teste',quantity:10,unit:'sacos',category:null,reference_company:'Empresa de teste',priority:'urgente',created_at:'2026-10-15T12:00:00Z'},{id:'second',product_id:'catalog-1',product_name:'Areia de teste',quantity:5,unit:'sacos',category:null,reference_company:null,priority:'normal',created_at:'2026-10-14T12:00:00Z'}]} total={2} queryText="" priority="" companies={['Empresa de teste']}/></> : <HomeDashboard summary={{amount:123456,count:1,missing:8,urgent:3,upcoming:[bill]}}/>}</AppShell>;
  createRoot(document.getElementById('root')!).render(view);
}
void mount();
