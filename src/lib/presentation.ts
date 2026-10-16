export const formatMoney = (cents: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
export const formatDate = (date: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
export const dateMonth = (date: string) => new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`)).replace('.', '');
export function supplierName(relation: unknown): string {
  const item = (Array.isArray(relation) ? relation[0] : relation) as { name?: string } | null;
  return item?.name ?? 'Fornecedor não informado';
}
