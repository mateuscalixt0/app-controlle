import { PageHeading } from "@/components/page-heading";
import { BillEntryForm } from "@/components/bill-entry-form";
import { addBill } from "./actions";

export default async function NewBillPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <>
      <PageHeading eyebrow="NOVO BOLETO" title="Adicionar boleto" description="Tire uma foto ou anexe um documento. Os dados ficam sob seu controle antes de salvar." />
      <BillEntryForm action={addBill} error={erro} />
    </>
  );
}
