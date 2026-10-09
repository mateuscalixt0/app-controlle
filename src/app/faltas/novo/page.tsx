import { DemoNotice } from "@/components/demo-notice";
import { PageHeading } from "@/components/page-heading";

export default function NewMissingItemPage() {
  return (
    <>
      <PageHeading eyebrow="LISTA DE FALTAS" title="Anotar produto" description="Peça apenas o essencial para registrar rapidamente no balcão." />
      <DemoNotice>formulário visual; o envio ficará disponível quando a persistência segura for implementada.</DemoNotice>
      <form className="card form-card">
        <label>Produto <span aria-hidden="true">*</span><input disabled required placeholder="Ex.: Cimento CP II 50 kg" /></label>
        <label>Quantidade <span aria-hidden="true">*</span><input disabled required inputMode="decimal" placeholder="Ex.: 20" /></label>
        <fieldset><legend>Prioridade <small>(opcional)</small></legend><p className="helper-text">Sem escolha, será usada a prioridade Normal.</p><div className="priority-options"><label className="option-normal"><input defaultChecked disabled name="priority" type="radio" />Normal</label><label className="option-medium"><input disabled name="priority" type="radio" />Média</label><label className="option-urgent"><input disabled name="priority" type="radio" />Precisa comprar</label></div></fieldset>
        <p className="helper-box">Categoria, unidade e empresa poderão ser conferidas nos detalhes. Nenhuma delas será atribuída por suposição. A classificação por IA permanece fora desta entrega.</p>
        <button className="primary-action" disabled type="submit">Salvar na lista</button>
      </form>
    </>
  );
}
