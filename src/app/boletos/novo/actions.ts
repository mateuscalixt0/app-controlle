'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/supabase/session';
import { parseBoletoCode, validCivilDate } from '@/lib/boleto-code';
import { validateBillFile } from '@/lib/bill-file';

function parseAmountCents(value: string) {
  const normalized = value.trim().replace(/\s/g, '').replace(/^R\$/i, '');
  if (!/^(?:\d{1,3}(?:\.\d{3})*|\d+)(?:,\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ''] = normalized.replace(/\./g, '').split(',');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function currentStore() {
  const session = await getCurrentSession();
  if (!session) redirect('/login');
  if (!session.storeId) redirect('/configurar-loja');
  return { ...session, storeId: session.storeId };
}
export async function createSupplier(name: string) {
  const normalized = name.trim();
  if (!normalized || normalized.length > 160) throw new Error('Informe um nome de fornecedor válido.');
  const { supabase, storeId } = await currentStore();
  const existing = await supabase.from('suppliers').select('id,name,document').eq('store_id', storeId).eq('name', normalized).maybeSingle();
  if (existing.error) throw new Error('Não foi possível consultar o fornecedor.');
  if (existing.data) return existing.data;
  const created = await supabase.from('suppliers').insert({ store_id: storeId, name: normalized }).select('id,name,document').single();
  if (created.error || !created.data) throw new Error('Não foi possível salvar o fornecedor.');
  return created.data;
}
export async function createBill(input: { id?: string; supplier: string; description: string; amount: string; dueDate: string; beneficiaryDocument?: string; digitableLine?: string }) {
  const supplierName = input.supplier.trim(), description = input.description.trim(), amountCents = parseAmountCents(input.amount);
  const beneficiaryDocument = (input.beneficiaryDocument ?? '').replace(/\D/g, '');
  const digitableLine = input.digitableLine?.trim() ? parseBoletoCode(input.digitableLine).code : '';
  if (input.id && !uuid.test(input.id) || !supplierName || supplierName.length > 160 || !description || description.length > 240 || amountCents === null || !validCivilDate(input.dueDate) || beneficiaryDocument && !/^\d{11}(\d{3})?$/.test(beneficiaryDocument)) throw new Error('Confira os campos obrigatórios: beneficiário, valor positivo e vencimento válido.');
  const { supabase, storeId } = await currentStore();
  // Stable client id makes retries safe even when the original response is lost.
  if (input.id) {
    const { data: existing, error } = await supabase.from('bills').select('id,amount_cents,due_date,description,beneficiary_document,digitable_line,suppliers(name)').eq('id', input.id).eq('store_id', storeId).maybeSingle();
    if (error) throw new Error('Não foi possível conferir o cadastro. Tente novamente.');
    if (existing) {
      const relation = existing.suppliers as unknown as { name: string } | { name: string }[] | null;
      const supplier = Array.isArray(relation) ? relation[0] : relation;
      if (existing.amount_cents !== amountCents || existing.due_date !== input.dueDate || existing.description !== description || (existing.beneficiary_document ?? '') !== beneficiaryDocument || (existing.digitable_line ?? '') !== digitableLine || supplier?.name !== supplierName) throw new Error('Este boleto já foi cadastrado. Restaure os dados confirmados para concluir o anexo, sem criar outro boleto.');
      return { billId: existing.id as string, storeId };
    }
  }
  const supplierResult = await supabase.from('suppliers').select('id').eq('store_id', storeId).eq('name', supplierName).maybeSingle();
  if (supplierResult.error) throw new Error('Não foi possível conferir o fornecedor.');
  let supplier = supplierResult.data;
  if (!supplier) {
    const result = await supabase.from('suppliers').insert({ store_id: storeId, name: supplierName }).select('id').single();
    if (result.error || !result.data) throw new Error('Não foi possível salvar o fornecedor.');
    supplier = result.data;
  }
  const { data: bill, error } = await supabase.from('bills').insert({ ...(input.id ? { id: input.id } : {}), store_id: storeId, supplier_id: supplier.id, description, amount_cents: amountCents, due_date: input.dueDate, beneficiary_document: beneficiaryDocument || null, digitable_line: digitableLine || null }).select('id').single();
  if (error || !bill) throw new Error('Não foi possível confirmar o cadastro. Tente novamente nesta tela.');
  revalidatePath('/boletos');
  return { billId: bill.id as string, storeId };
}
export async function attachBillDocument(input: { billId: string; storagePath: string; originalName: string; contentType: string; sizeBytes: number }) {
  if (!uuid.test(input.billId) || !input.originalName.trim() || input.originalName.length > 255 || !['application/pdf', 'image/jpeg', 'image/png'].includes(input.contentType) || !Number.isInteger(input.sizeBytes) || input.sizeBytes < 1 || input.sizeBytes > 10 * 1024 * 1024) throw new Error('Metadados do documento inválidos.');
  const { supabase, userId, storeId } = await currentStore();
  const prefix = `${storeId}/${input.billId}/`;
  if (!input.storagePath.startsWith(prefix) || !/^[0-9a-f-]{36}\.(pdf|jpg|png)$/.test(input.storagePath.slice(prefix.length))) throw new Error('Caminho de arquivo inválido.');
  const { data: bill } = await supabase.from('bills').select('id').eq('id', input.billId).eq('store_id', storeId).maybeSingle();
  if (!bill) throw new Error('Boleto não encontrado nesta loja.');
  const { data: stored, error: downloadError } = await supabase.storage.from('bill-documents').download(input.storagePath);
  if (downloadError || !stored || stored.size !== input.sizeBytes || stored.type !== input.contentType) throw new Error('O boleto foi salvo, mas o arquivo não foi confirmado. Tente guardar o arquivo novamente.');
  await validateBillFile(new File([stored], input.originalName, { type: stored.type }));
  const { error } = await supabase.from('bill_documents').upsert({ store_id: storeId, bill_id: input.billId, storage_path: input.storagePath, original_name: input.originalName, content_type: input.contentType, size_bytes: input.sizeBytes, created_by: userId, extraction_status: 'confirmed' }, { onConflict: 'storage_path', ignoreDuplicates: true });
  if (error) throw new Error('O boleto e o arquivo foram guardados, mas o vínculo falhou. Tente novamente nesta tela.');
  revalidatePath('/boletos');
}
export async function addBill(formData: FormData) {
  try { await createBill({ supplier: String(formData.get('supplier') ?? ''), description: String(formData.get('description') ?? ''), amount: String(formData.get('amount') ?? ''), dueDate: String(formData.get('due_date') ?? '') }); }
  catch { redirect('/boletos/novo?erro=validacao'); }
  redirect('/boletos');
}
