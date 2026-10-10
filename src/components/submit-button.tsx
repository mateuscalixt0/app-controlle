"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children, pendingLabel, className = "primary-action", ...props }: React.ComponentProps<"button"> & { pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button {...props} aria-busy={pending} className={className} disabled={pending || props.disabled} type="submit">
      {pending ? <><span className="loading-spinner" aria-hidden="true" />{pendingLabel}</> : children}
    </button>
  );
}
