import { DemoNotice } from "@/components/demo-notice";
import { Icon } from "@/components/icons";
import { PageHeading } from "@/components/page-heading";
import { addBill } from "./actions";

export default async function NewBillPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <>
      <PageHeading eyebrow="NOVO BOLETO" title="Como deseja adicionar?" description="Envie o documento, confira cada informação e só então confirme o cadastro." />
      <DemoNotice>a leitura e o salvamento ainda não estão ativos. Selecionar um arquivo não o envia.</DemoNotice>
      <ol className="steps" aria-label="Etapas do cadastro">
        <li className="current"><span>1</span>Enviar</li><li><span>2</span>Ler</li><li><span>3</span>Conferir</li><li><span>4</span>Salvar</li>
      </ol>
      <section className="upload-grid" aria-labelledby="arquivo-title">
        <h2 id="arquivo-title" className="sr-only">Escolher origem do documento</h2>
        <label className="upload-card">
          <span className="upload-icon"><Icon name="camera" /></span>
          <strong>Tirar uma foto</strong>
          <small>Use boa luz e enquadre o boleto inteiro.</small>
          <input accept="image/*" capture="environment" disabled type="file" />
        </label>
        <label className="upload-card">
          <span className="upload-icon"><Icon name="upload" /></span>
          <strong>Enviar documento</strong>
          <small>PDF, JPG ou PNG. Limites serão definidos na implementação segura.</small>
          <input accept="application/pdf,image/jpeg,image/png" disabled type="file" />
        </label>
      </section>
      <section className="card flow-preview" aria-labelledby="conferencia-title">
        <p className="eyebrow">PRÓXIMA ETAPA</p><h2 id="conferencia-title">Conferir antes de salvar</h2>
        <p>Beneficiário, CPF/CNPJ, valor, vencimento, código e descrição aparecerão em campos editáveis. Informações ausentes ou duvidosas serão destacadas, sem preenchimento inventado.</p>
        <div className="field-skeleton"><span>Beneficiário/fornecedor</span><div /></div>
        <div className="two-columns"><div className="field-skeleton"><span>Valor</span><div /></div><div className="field-skeleton warning"><span>Vencimento — conferir</span><div /></div></div>
      </section>
      <details className="card manual-entry"><summary className="secondary-action">Preencher manualmente</summary>
        <form action={addBill} className="form-card manual-form">
          <label>Fornecedor <span aria-hidden="true">*</span><input name="supplier" required maxLength={160} /></label>
          <label>Descrição <span aria-hidden="true">*</span><input name="description" required maxLength={240} /></label>
          <label>Valor (R$) <span aria-hidden="true">*</span><input name="amount" required inputMode="decimal" placeholder="Ex.: 486,20" /></label>
          <label>Vencimento <span aria-hidden="true">*</span><input name="due_date" required type="date" /></label>
          {erro && <p className="form-error" role="alert">Não foi possível salvar. Confira os dados e tente novamente.</p>}
          <button className="primary-action" type="submit">Salvar boleto</button>
        </form>
      </details>
    </>
  );
}
