// Harness only: no financial data is persisted by browser tests.
const state = globalThis as typeof globalThis & { saves?: string[]; uploadAttempts?: number };
export async function createBill(input: { id: string }) { state.saves ??= []; state.saves.push(input.id); return { billId: input.id, storeId: '00000000-0000-0000-0000-000000000001' }; }
export async function attachBillDocument() { return; }
export function useRouter() { return { push: () => {}, refresh: () => {} }; }
export function createClient() { return { storage: { from: () => ({ upload: async () => { state.uploadAttempts = (state.uploadAttempts ?? 0) + 1; return { error: state.uploadAttempts === 1 ? { statusCode: '503' } : null }; } }) } }; }
