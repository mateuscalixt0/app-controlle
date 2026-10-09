import Link from "next/link";
import { Icon } from "@/components/icons";
import { MissingListDemo } from "@/components/missing-list-demo";
import { PageHeading } from "@/components/page-heading";

export default function MissingItemsPage() {
  return (
    <>
      <PageHeading eyebrow="COMPRAS" title="Lista de faltas" description="Anote o que acabou e consulte as referências de preço registradas." />
      <Link className="primary-action full-action top-action" href="/faltas/novo"><Icon name="list" /> Anotar produto faltante</Link>
      <MissingListDemo />
    </>
  );
}
