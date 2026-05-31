# Sticker Platform MVP

MVP mobile-first para plataforma B2C de stickers transparentes.

## Stack

- Next.js + React + TypeScript
- Tailwind CSS + componentes no padrao shadcn/ui
- NextAuth/Auth.js (link magico com Resend)
- Prisma + PostgreSQL

## Fluxos implementados

- `Login` com e-mail da compra (link magico)
- `Galeria` com busca textual e categorias iniciais
- `Detalhe do sticker` com `Copiar Sticker` e `Baixar PNG`
- Suporte a cadastro de sticker em `PNG` ou `SVG` (SVG convertido para PNG no copiar/baixar)
- `Painel Admin` para publicar/despublicar stickers
- `Painel Admin` para excluir stickers e gerenciar categorias (criar/editar/excluir)
- `Painel Admin` para adicionar/remover variantes de cor por sticker
- Fallback automatico para download quando copia de imagem nao for suportada
- Acesso condicionado a compra aprovada na Kiwify (webhook + status no banco)

## Execucao local

1. Instale dependencias:
   - `npm install`
2. Configure variaveis:
   - copie `.env.example` para `.env.local`
   - para admins: use `ADMIN_EMAIL` (1) ou `ADMIN_EMAILS` (lista separada por virgula)
   - para acesso antecipado sem Kiwify (sem admin): use `EARLY_ACCESS_EMAIL` (1) ou `EARLY_ACCESS_EMAILS` (lista separada por virgula)
3. Gere cliente Prisma:
   - `npm run prisma:generate`
4. Aplique migration inicial:
   - `npm run prisma:migrate -- --name init`
5. Rode seed:
   - `npm run prisma:seed`
6. Inicie:
   - `npm run dev`
7. Acesse pela rede local:
   - `http://192.168.15.4:3000`

## Estrutura principal

- `app/login/page.tsx` login por link magico
- `app/gallery/page.tsx` galeria com busca/categorias
- `app/gallery/[slug]/page.tsx` detalhe com acoes copiar/baixar
- `app/admin/page.tsx` painel admin de catalogo
- `prisma/schema.prisma` modelos auth + dominio de stickers

## Kiwify (acesso pago)

Variaveis necessarias:
- `KIWIFY_WEBHOOK_TOKEN`: token do webhook (validado por query `?token=` ou header `x-kiwify-webhook-token`)
- `KIWIFY_SIMULATION_KEY`: chave para endpoint interno de simulacao
- `KIWIFY_ALLOWED_PRODUCT_IDS` (opcional, recomendado): lista de IDs de produto separados por virgula para ignorar eventos de outros produtos

Endpoints:
- Produção: `POST /api/webhooks/kiwify?token=SEU_TOKEN`
- Simulacao local: `POST /api/webhooks/kiwify/simulate?key=SUA_CHAVE`
- Health/check config: `GET /api/webhooks/kiwify`

Mapeamento de eventos:
- `approved` / `paid`: ativa acesso (`ACTIVE`) e provisiona usuario por e-mail
- `payment_failed` / `declined` / `cancelled` / `subscription_late`: aplica carencia de 7 dias (`GRACE`)
- `chargeback` / `refund`: bloqueia imediatamente (`BLOCKED`)
- nao mapeados: salvos como `IGNORED` no log de webhook

Regra de acesso antecipado:
- E-mails em `EARLY_ACCESS_EMAIL` / `EARLY_ACCESS_EMAILS` entram na galeria mesmo sem compra aprovada na Kiwify.
- Esses e-mails nao ganham permissao de admin automaticamente.

Checklist de configuracao na Kiwify:
1. Em `Apps > Webhooks`, crie webhook para a URL de producao (`https://SEU_DOMINIO/api/webhooks/kiwify?token=SEU_TOKEN`).
2. Selecione somente os gatilhos necessarios (compra aprovada, compra recusada/atrasada, assinatura cancelada, reembolso, chargeback).
3. Publique/atualize as variaveis de ambiente na Vercel.
4. Use `Testar webhook` na Kiwify e valide resposta `ok: true`.
5. Confira os registros em `KiwifyWebhookDelivery` e o status em `CustomerAccess`.
