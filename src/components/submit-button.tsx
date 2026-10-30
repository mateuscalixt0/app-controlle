"use client";
import { useFormStatus } from "react-dom";
import { Spinner } from "./loading-indicator";

export function SubmitButton({ children, pendingLabel, className }: { children: React.ReactNode; pendingLabel: string; className: string }) {
  const { pending } = useFormStatus();
  return <button className={className} type="submit" disabled={pending}>{pending && <Spinner />}{pending ? pendingLabel : children}</button>;
}
