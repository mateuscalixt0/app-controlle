import Link from "next/link";
import { ProductComparison } from "@/components/product-comparison";

export default async function ProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  return <><Link className="text-action" href="/faltas">← Voltar para faltas</Link><ProductComparison productId={productId} /></>;
}
