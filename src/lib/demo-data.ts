export type Priority = "normal" | "media" | "urgente";

export const priorityMeta: Record<Priority, { label: string; className: string }> = {
  normal: { label: "Normal", className: "priority-normal" },
  media: { label: "Média", className: "priority-medium" },
  urgente: { label: "Precisa comprar", className: "priority-urgent" },
};
