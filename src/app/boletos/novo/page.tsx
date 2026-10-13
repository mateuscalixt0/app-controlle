import Link from "next/link";
import { BillDocumentImport } from "@/components/bill-document-import";
import { BillEditForm } from "@/components/bill-edit-form";
import { Icon } from "@/components/icons";
import { getCurrentSession } from "@/lib/supabase/session";

export default async function NewBillPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const session = edit ? await getCurrentSession() : null;
  type BillRow = { id: string; description: string; amount_cents: number; due_date: string; digitable_line: string | null; suppliers: unknown };
  let loadedBill: unknown = null;
  if (edit && session?.storeId) {
    const result = await session.supabase.from('bills').select('id,description,amount_cents,due_date,digitable_line,suppliers(name)').eq('id', edit).eq('store_id', session.storeId).maybeSingle();
    loadedBill = result.data;
  }
  const bill = loadedBill as BillRow | null;
  const relation = bill?.suppliers as { name?: string } | { name?: string }[] | null;
  const supplier = Array.isArray(relation) ? relation[0]?.name : relation?.name;
  return (
    <div className="new-bill-screen">
      <div className="new-bill-title">
        <Link aria-label="Voltar para boletos" className="back-link" href="/boletos"><Icon name="back" /></Link>
        <h1>{bill ? 'Editar boleto' : 'Adicionar boleto'}</h1>
      </div>

      {bill ? <BillEditForm bill={{ id: bill.id, supplier: supplier ?? '', description: bill.description, amount: (bill.amount_cents / 100).toFixed(2).replace('.', ','), dueDate: bill.due_date, line: bill.digitable_line ?? '' }} /> : <BillDocumentImport />}

      <div className="new-bill-empty" aria-hidden="true">
        <div className="document-illustration"><Icon name="bills" /></div>
        <strong>Envie seu boleto para continuar</strong>
        <p>Vamos ler as informações e preencher os dados automaticamente.</p>
      </div>

    </div>
  );
}
