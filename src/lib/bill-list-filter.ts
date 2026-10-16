export type BillListStatus = 'all' | 'pending' | 'paid' | 'cancelled';

export function getBillListStatus(value?: string): BillListStatus {
  if (value === 'all' || value === 'paid' || value === 'cancelled') return value;
  return 'pending';
}
