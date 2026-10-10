import Link from "next/link";
import { BillDocumentImport } from "@/components/bill-document-import";
import { Icon } from "@/components/icons";

export default function NewBillPage() {
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

    </div>
  );
}
