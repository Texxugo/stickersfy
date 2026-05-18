"use client";

import { useFormStatus } from "react-dom";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type LoginFormProps = {
  action: (formData: FormData) => Promise<void>;
  errorMessage?: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" className="w-full">
      {pending ? "Enviando link..." : "Receber link mágico"}
    </Button>
  );
}

export function LoginForm({ action, errorMessage }: LoginFormProps) {
  return (
    <form action={action} className="space-y-4">
      <label className="block space-y-2">
        <span className="text-sm font-semibold text-muted">
          E-mail da compra na Kiwify
        </span>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="voce@exemplo.com"
          required
        />
      </label>

      {errorMessage ? (
        <p className="rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-xs font-medium text-warning">
          {errorMessage}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
