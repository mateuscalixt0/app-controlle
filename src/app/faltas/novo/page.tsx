import { DemoNotice } from "@/components/demo-notice";
import { PageHeading } from "@/components/page-heading";
import { addMissingItem } from "./actions";

export default async function NewMissingItemPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <>
      <PageHeading eyebrow="LISTA DE FALTAS" title="Anotar produto" description="Peça apenas o essencial para registrar rapidamente no balcão." />
      <form action={addMissingItem} className="card form-card">
        <label>Produto <span aria-hidden="true">*</span><input name="product" required maxLength={200} placeholder="Ex.: Cimento CP II 50 kg" /></label>
        <label>Quantidade <span aria-hidden="true">*</span><input name="quantity" required inputMode="decimal" type="number" min="0.001" step="0.001" placeholder="Ex.: 20" /></label>
        <fieldset><legend>Prioridade <small>(opcional)</small></legend><p className="helper-text">Sem escolha, será usada a prioridade Normal.</p><div className="priority-options"><label className="option-normal"><input defaultChecked name="priority" type="radio" value="normal" />Normal</label><label className="option-medium"><input name="priority" type="radio" value="media" />Média</label><label className="option-urgent"><input name="priority" type="radio" value="urgente" />Precisa comprar</label></div></fieldset>
        {erro && <p className="form-error" role="alert">Não foi possível salvar. Confira os dados e tente novamente.</p>}
        <p className="helper-box">Categoria, unidade e empresa poderão ser conferidas nos detalhes. Nenhuma delas será atribuída por suposição. A classificação por IA permanece fora desta entrega.</p>
        <button className="primary-action" type="submit">Salvar na lista</button>
      </form>
    </>
  );
}
