"use client";

import { signIn } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

type BridgeStatus =
  | { state: "idle" }
  | { state: "pending" }
  | { state: "ready"; code: string }
  | { state: "expired" }
  | { state: "consumed" }
  | { state: "invalid" };

export function MagicLinkWaiting() {
  const [state, setState] = useState<"pending" | "signing-in" | "expired" | "error">("pending");
  const signingInRef = useRef(false);

  useEffect(() => {
    let canceled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function attemptSignIn(code: string) {
      signingInRef.current = true;
      setState("signing-in");

      try {
        const result = await signIn("magic-bridge", {
          code,
          redirect: false,
          callbackUrl: "/gallery"
        });

        if (result?.url) {
          window.location.href = result.url;
          return;
        }
      } catch {
        // fica no fallback abaixo
      }

      signingInRef.current = false;
      if (!canceled) setState("error");
    }

    async function poll() {
      if (signingInRef.current) return;

      try {
        const response = await fetch("/api/auth/magic-bridge/status", {
          method: "GET",
          cache: "no-store"
        });

        if (!response.ok) {
          if (!canceled) setState("error");
          return;
        }

        const status = (await response.json()) as BridgeStatus;

        if (status.state === "ready") {
          await attemptSignIn(status.code);
          return;
        }

        if (status.state === "pending") {
          if (!canceled) setState("pending");
          return;
        }

        if (
          status.state === "idle" ||
          status.state === "expired" ||
          status.state === "consumed" ||
          status.state === "invalid"
        ) {
          if (!canceled) setState("expired");
          return;
        }

        if (!canceled) setState("error");
      } catch {
        if (!canceled) setState("error");
      }
    }

    poll();
    timer = setInterval(poll, 3000);

    return () => {
      canceled = true;
      if (timer) clearInterval(timer);
    };
  }, []);

  return (
    <div className="space-y-2 text-sm text-muted">
      {state === "pending" ? (
        <p>Aguardando confirmacao no e-mail. Assim que voce abrir o link em qualquer navegador, este dispositivo entra automaticamente.</p>
      ) : null}
      {state === "signing-in" ? <p>Confirmacao recebida. Finalizando acesso...</p> : null}
      {state === "expired" ? <p>Este pedido expirou. Solicite um novo link para continuar.</p> : null}
      {state === "error" ? <p>Nao foi possivel concluir automaticamente. Recarregue a pagina ou solicite um novo link.</p> : null}
    </div>
  );
}
