# Sticker Platform MVP

MVP mobile-first para plataforma B2C de stickers transparentes.

## Stack

- Next.js + React + TypeScript
- Tailwind CSS + componentes no padrão shadcn/ui
- NextAuth/Auth.js (link mágico com Resend)
- Prisma + PostgreSQL

## Fluxos implementados

- `Login` com e-mail da compra (link mágico)
- `Galeria` com busca textual e categorias iniciais
- `Detalhe do sticker` com `Copiar Sticker` e `Baixar PNG`
- Suporte a cadastro de sticker em `PNG` ou `SVG` (SVG convertido para PNG no copiar/baixar)
- `Painel Admin` para publicar/despublicar stickers
- `Painel Admin` para excluir stickers e gerenciar categorias (criar/editar/excluir)
- `Painel Admin` para adicionar/remover variantes de cor por sticker
- Fallback automático para download quando cópia de imagem não for suportada

## Execução local

1. Instale dependências:
   - `npm install`
2. Configure variáveis:
   - copie `.env.example` para `.env.local`
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

- `app/login/page.tsx` login por link mágico
- `app/gallery/page.tsx` galeria com busca/categorias
- `app/gallery/[slug]/page.tsx` detalhe com ações copiar/baixar
- `app/admin/page.tsx` painel admin de catálogo
- `prisma/schema.prisma` modelos auth + domínio de stickers
