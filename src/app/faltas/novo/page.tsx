import { ProductPicker } from "@/components/product-picker";
import { PageHeading } from "@/components/page-heading";
import { addMissingItem } from "./actions";

export default async function NewMissingItemPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <>
      <PageHeading eyebrow="LISTA DE FALTAS" title="Anotar produto" description="Registre o que está faltando para a próxima compra." />
      <form action={addMissingItem} className="card form-card">
        <ProductPicker />
        <label>Quantidade <span aria-hidden="true">*</span><input name="quantity" required inputMode="decimal" type="number" min="0.001" step="0.001" placeholder="Ex.: 20" /></label>
        <fieldset><legend>Prioridade <small>(opcional)</small></legend><p className="helper-text">Sem escolha, será usada a prioridade Normal.</p><div className="priority-options"><label className="option-normal"><input defaultChecked name="priority" type="radio" value="normal" />Normal</label><label className="option-medium"><input name="priority" type="radio" value="media" />Média</label><label className="option-urgent"><input name="priority" type="radio" value="urgente" />Precisa comprar</label></div></fieldset>
        {erro && <p className="form-error" role="alert">Não foi possível salvar. Confira os dados e tente novamente.</p>}
        <p className="helper-box">Você poderá conferir as informações registradas nos detalhes do produto.</p>
        <button className="primary-action" type="submit">Salvar na lista</button>
      </form>
    </>
  );
}
