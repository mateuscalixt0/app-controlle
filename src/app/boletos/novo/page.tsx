import Link from "next/link";
import { BillDocumentImport } from "@/components/bill-document-import";
import { Icon } from "@/components/icons";
import { addBill } from "./actions";

export default async function NewBillPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;

  return (
    <div className="new-bill-screen">
      <div className="new-bill-title">
        <Link aria-label="Voltar para boletos" className="back-link" href="/boletos"><Icon name="back" /></Link>
        <h1>Adicionar boleto</h1>
      </div>

      <BillDocumentImport />

      <div className="new-bill-empty" aria-hidden="true">
        <div className="document-illustration"><Icon name="bills" /></div>
        <strong>Envie seu boleto para continuar</strong>
        <p>Vamos ler as informações e preencher os dados automaticamente.</p>
      </div>

      <details className="card manual-entry">
        <summary className="secondary-action">Preencher manualmente</summary>
        <form action={addBill} className="form-card manual-form">
          <label>Fornecedor <input name="supplier" required maxLength={160} /></label>
          <label>Descrição <input name="description" required maxLength={240} /></label>
          <label>Valor (R$) <input name="amount" required inputMode="decimal" placeholder="Ex.: 486,20" /></label>
          <label>Vencimento <input name="due_date" required type="date" /></label>
          {erro && <p className="form-error" role="alert">Não foi possível salvar. Confira os dados e tente novamente.</p>}
          <button className="primary-action" type="submit">Salvar boleto</button>
        </form>
      </details>
    </div>
  );
}