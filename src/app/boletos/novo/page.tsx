import { PageHeading } from "@/components/page-heading";
import { BillDocumentImport } from "@/components/bill-document-import";
import { addBill } from "./actions";

export default async function NewBillPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return <><PageHeading eyebrow="NOVO BOLETO" title="Adicionar boleto" description="Envie um documento ou preencha manualmente. A revisão é obrigatória antes de salvar." /><BillDocumentImport /><details className="card manual-entry"><summary className="secondary-action">Preencher manualmente</summary><form action={addBill} className="form-card manual-form"><label>Fornecedor <input name="supplier" required maxLength={160}/></label><label>Descrição <input name="description" required maxLength={240}/></label><label>Valor (R$) <input name="amount" required inputMode="decimal" placeholder="Ex.: 486,20"/></label><label>Vencimento <input name="due_date" required type="date"/></label>{erro&&<p className="form-error" role="alert">Não foi possível salvar. Confira os dados e tente novamente.</p>}<button className="primary-action" type="submit">Salvar boleto</button></form></details></>;
}