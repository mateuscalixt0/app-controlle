-- Compatibilidade do fluxo de boletos em instalações anteriores à importação de NF-e.
-- Aditiva e idempotente; não altera registros financeiros, funções ou políticas RLS.
alter table public.bills add column if not exists beneficiary_document text;
alter table public.bills add column if not exists digitable_line text;
alter table public.bill_documents add column if not exists extraction_status text not null default 'not_processed'
  check (extraction_status in ('not_processed', 'needs_manual_review', 'confirmed', 'unsupported', 'failed'));
