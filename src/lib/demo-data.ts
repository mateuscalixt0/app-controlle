export type Priority = "normal" | "media" | "urgente";

export const priorityMeta: Record<Priority, { label: string; className: string }> = {
  normal: { label: "Normal", className: "priority-normal" },
  media: { label: "Média", className: "priority-medium" },
  urgente: { label: "Precisa comprar", className: "priority-urgent" },
};

export const demoMissingItems = [
  {
    id: "cimento-cp2",
    name: "Cimento CP II 50 kg",
    quantity: "20 sacos",
    priority: "urgente" as Priority,
    category: "Cimentos",
    referenceCompany: "Obra Forte",
    createdAt: "08/10/2026",
    bestPrice: "R$ 31,90",
    supplier: "Depósito Central",
    priceDate: "02/10/2026",
    unit: "saco 50 kg",
  },
  {
    id: "tubo-pvc",
    name: "Tubo PVC 100 mm",
    quantity: "12 barras",
    priority: "media" as Priority,
    category: "Hidráulica",
    referenceCompany: null,
    createdAt: "07/10/2026",
    bestPrice: "R$ 68,40",
    supplier: "Casa do Encanador",
    priceDate: "28/09/2026",
    unit: "barra 6 m",
  },
  {
    id: "trincha",
    name: "Trincha 2 polegadas",
    quantity: "8",
    priority: "normal" as Priority,
    category: null,
    referenceCompany: null,
    createdAt: "06/10/2026",
    bestPrice: null,
    supplier: null,
    priceDate: null,
    unit: null,
  },
];

export const demoBills = [
  { supplier: "Energia da Loja", description: "Conta de energia", dueDate: "10/10/2026", amount: "R$ 486,20", status: "Vence em 2 dias" },
  { supplier: "Depósito Central", description: "Materiais para reposição", dueDate: "14/10/2026", amount: "R$ 2.340,00", status: "Vence nesta semana" },
  { supplier: "Internet Comercial", description: "Plano mensal", dueDate: "20/10/2026", amount: "R$ 129,90", status: "Próximo vencimento" },
];
