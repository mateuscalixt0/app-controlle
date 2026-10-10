"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";

export function BillEntryForm({ action, error }: { action: (formData: FormData) => void | Promise<void>; error?: string }) {
  const [fileName, setFileName] = useState("");

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setFileName(file ? file.name : "");
  }

  return (
    <form action={action} className="form-card">
      <section className="upload-grid" aria-labelledby="arquivo-title">
        <h2 id="arquivo-title" className="sr-only">Anexar documento do boleto</h2>
        <label className="upload-card">
          <span className="upload-icon"><Icon name="camera" /></span>
          <strong>Tirar uma foto</strong>
          <small>Use boa luz e enquadre o boleto inteiro.</small>
          <input accept="image/jpeg,image/png" capture="environment" name="camera_document" onChange={onFileChange} type="file" />
        </label>
        <label className="upload-card">
          <span className="upload-icon"><Icon name="upload" /></span>
          <strong>Enviar documento</strong>
          <small>PDF, JPG ou PNG, com até 10 MB.</small>
          <input accept="application/pdf,image/jpeg,image/png" name="document" onChange={onFileChange} type="file" />
        </label>
      </section>
      {fileName && <p className="selected-file" role="status"><Icon name="document" />Arquivo selecionado: {fileName}</p>}
      <section className="card entry-fields" aria-labelledby="dados-title">
        <p className="eyebrow">DADOS DO BOLETO</p>
        <h2 id="dados-title">Preencha os dados que precisa registrar</h2>
        <p className="helper-text">O documento fica anexado ao boleto. A leitura automática ainda não preenche campos: nada será inventado.</p>
        <div className="form-card">
          <label>Fornecedor <span aria-hidden="true">*</span><input name="supplier" required maxLength={160} /></label>
          <label>Descrição <span aria-hidden="true">*</span><input name="description" required maxLength={240} /></label>
          <label>Valor (R$) <span aria-hidden="true">*</span><input name="amount" required inputMode="decimal" placeholder="Ex.: 486,20" /></label>
          <label>Vencimento <span aria-hidden="true">*</span><input name="due_date" required type="date" /></label>
        </div>
      </section>
      {error && <p className="form-error" role="alert">{error === "arquivo" ? "Não foi possível enviar o arquivo. Confira o formato e o tamanho e tente novamente." : "Não foi possível salvar. Confira os dados e tente novamente."}</p>}
      <SubmitButton className="primary-action full-action" pendingLabel="Salvando boleto…">Salvar boleto</SubmitButton>
    </form>
  );
}
