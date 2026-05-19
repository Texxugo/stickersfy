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

- Endpoint webhook: `POST /api/webhooks/kiwify?token=SEU_TOKEN`
- Endpoint simulacao: `POST /api/webhooks/kiwify/simulate?key=SUA_CHAVE`

Eventos processados:
- `approved` / `paid`: ativa acesso
- `payment_failed` / `declined` / `cancelled`: coloca em carencia de 7 dias
- `chargeback` / `refund`: bloqueia acesso imediatamente
