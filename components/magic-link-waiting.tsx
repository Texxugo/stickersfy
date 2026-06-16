"use client";

import { getSession, signIn } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

type BridgeStatus =
  | { state: "idle" }
  | { state: "pending" }
  | { state: "ready"; code: string }
  | { state: "expired" }
  | { state: "consumed" }
  | { state: "invalid" };

const POLL_INTERVAL_MS = 5000;
const MAX_POLL_DURATION_MS = 5 * 60 * 1000;

export function MagicLinkWaiting() {
  const [state, setState] = useState<"pending" | "signing-in" | "expired" | "error">("pending");
  const signingInRef = useRef(false);

  useEffect(() => {
    let canceled = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    const startedAt = Date.now();

    function stopPolling() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    async function attemptSignIn(code: string) {
      signingInRef.current = true;
      setState("signing-in");

      try {
        const result = await signIn("magic-bridge", {
          code,
          redirect: false,
          redirectTo: "/gallery"
        });

        if (result?.error) {
          signingInRef.current = false;
          if (!canceled) setState("error");
          return;
        }

        const session = await getSession();
        if (session?.user?.email) {
          window.location.href = "/gallery";
          return;
        }

        // Fallback para inconsistencias de retorno no cliente do Auth.js v5.
        window.location.href = "/gallery";
        return;
      } catch {
        // fica no fallback abaixo
      }

      signingInRef.current = false;
      if (!canceled) setState("error");
    }

    async function poll() {
      if (signingInRef.current) return;

      // Para de bater no banco depois do limite (aba esquecida aberta).
      if (Date.now() - startedAt > MAX_POLL_DURATION_MS) {
        stopPolling();
        if (!canceled) setState("expired");
        return;
      }

      // Nao consome recursos enquanto a aba esta em segundo plano.
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }

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
    timer = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      canceled = true;
      stopPolling();
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
