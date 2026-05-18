# Plataforma de Stickers B2C

Contexto de venda e entrega de stickers com fundo transparente para uso em redes sociais. Este contexto define a linguagem de negócio para acesso pago, liberação pós-compra e uso da galeria.

## Language

**Cliente**:
Pessoa compradora que recebe acesso à plataforma após confirmação de pagamento.
_Avoid_: Usuário, comprador, assinante

**E-mail Canônico do Cliente**:
Endereço de e-mail informado na Kiwify usado como identificador único do Cliente.
_Avoid_: Username, login ID, e-mail alternativo

**Solicitação Formal de Troca de E-mail**:
Processo de suporte para alterar o e-mail canônico do Cliente após validação de titularidade.
_Avoid_: Troca automática, autoatendimento de e-mail

**Administrador**:
Perfil único responsável por publicar e organizar stickers na galeria.
_Avoid_: Admin master, operador

**Sticker**:
Imagem com fundo transparente disponibilizada para uso em stories e publicações.
_Avoid_: Figurinha, arte

**Padrão PNG Transparente**:
Regra que exige stickers em arquivo PNG com fundo transparente.
_Avoid_: JPEG, imagem sem transparência, formato misto

**Limite de Tamanho de Sticker**:
Tamanho máximo de 1 MB por arquivo de sticker no upload.
_Avoid_: Upload sem limite, arquivos pesados

**Dimensão Mínima de Sticker**:
Resolução mínima de 128x128 pixels para publicação de sticker.
_Avoid_: Arquivo abaixo de 128x128, resolução indefinida

**Proporção Quadrada de Sticker**:
Regra que exige proporção 1:1 no arquivo publicado.
_Avoid_: Retangular livre, proporção variável

**Despublicação Imediata**:
Ação de remover o sticker da galeria no momento em que um erro é identificado.
_Avoid_: Remoção adiada, manutenção de item incorreto

**Catálogo Integral por Assinatura Ativa**:
Direito de acesso ao catálogo completo existente e aos novos stickers enquanto a assinatura estiver ativa.
_Avoid_: Biblioteca parcial por data de compra, acesso segmentado sem plano

**Limite de Sessões Simultâneas**:
Regra que restringe para 2 o número de sessões ativas por conta para reduzir compartilhamento indevido.
_Avoid_: Sessões ilimitadas, bloqueio total de múltiplos dispositivos

**Licença de Uso em Redes Sociais**:
Permissão para uso pessoal e comercial dos stickers em conteúdo de redes sociais, sem revenda dos arquivos.
_Avoid_: Revenda de sticker, sublicenciamento irrestrito

**Bloqueio por Abuso de Licença**:
Suspensão imediata do acesso quando houver evidência de revenda ou redistribuição indevida dos arquivos.
_Avoid_: Tolerância a revenda, punição apenas informal

**Escopo da Primeira Entrega**:
Primeira versão com telas de login, galeria e detalhe de sticker para validar uso mobile.
_Avoid_: Fluxo completo de administração no primeiro release

**Ações do Detalhe do Sticker**:
Conjunto padrão com botões `Copiar Sticker` e `Baixar PNG` na tela de detalhe.
_Avoid_: Detalhe sem ação principal, ação única sem fallback

**Categoria de Sticker**:
Agrupamento temático usado para organizar e navegar pelos stickers.
_Avoid_: Pasta, seção solta

**Categorias Iniciais do MVP**:
Conjunto inicial da galeria com `Bom dia`, `Boa tarde` e `Boa noite`.
_Avoid_: Catálogo amplo no lançamento

**Busca Textual**:
Mecanismo de pesquisa por palavras-chave para localizar stickers.
_Avoid_: Filtro visual, navegação manual

**Cópia Nativa de Sticker**:
Função que copia apenas o binário da imagem do sticker para a área de transferência, sem URL ou texto.
_Avoid_: Copiar link, copiar legenda, compartilhamento por URL

**Experiência Mobile-First**:
Diretriz de produto em que a navegação e o uso principal são otimizados para dispositivos móveis.
_Avoid_: Desktop-first, interface orientada a notebook

**Fallback de Cópia para Download**:
Fluxo automático que baixa o PNG e exibe instrução curta quando a cópia nativa não é suportada.
_Avoid_: Falha silenciosa, bloqueio sem alternativa

**Instrução Padrão de Fallback**:
Mensagem: `Sticker baixado. No Instagram, toque em adicionar imagem e selecione o PNG.`
_Avoid_: Instrução vaga, orientação sem próximo passo

**Administrador Único**:
Regra de operação em que apenas um administrador autorizado gerencia o catálogo.
_Avoid_: Equipe de moderação, múltiplos editores

**Compra Aprovada**:
Confirmação de pagamento vinda da Kiwify que habilita o acesso do Cliente.
_Avoid_: Pedido pago, venda concluída

**Processamento Idempotente de Compra Aprovada**:
Regra que impede duplicidade ao reprocessar o mesmo evento de compra aprovada.
_Avoid_: Recriação de conta, duplicação de cliente

**Reativação Automática de Acesso**:
Restauração do acesso quando uma nova Compra Aprovada é recebida após bloqueio por inadimplência.
_Avoid_: Liberação manual, fila de suporte

**Webhook Autenticado da Kiwify**:
Evento de cobrança aceito apenas quando a assinatura de segurança da Kiwify é válida.
_Avoid_: Webhook sem validação, evento não verificado

**Acesso Ativo**:
Estado em que o Cliente pode navegar, copiar e baixar Stickers.
_Avoid_: Conta liberada, login premium

**Assinatura**:
Contrato recorrente mensal ou anual que concede acesso à plataforma enquanto estiver adimplente.
_Avoid_: Compra única, plano vitalício

**Assinatura Ativa**:
Estado da Assinatura com cobrança válida e direito de acesso vigente.
_Avoid_: Pagamento isolado, acesso permanente

**Bloqueio por Estorno ou Chargeback**:
Revogação imediata do acesso quando a Kiwify confirma estorno ou chargeback.
_Avoid_: Acesso mantido após estorno, bloqueio adiado

**Período de Carência**:
Intervalo de 7 dias após falha de renovação em que o Cliente mantém acesso antes do bloqueio.
_Avoid_: Bloqueio imediato, tolerância indefinida

**Link Mágico de Acesso**:
URL de uso temporário enviada por e-mail para autenticar o Cliente sem senha inicial.
_Avoid_: Senha provisória, token fixo

**Validade do Link Mágico**:
Tempo máximo de 30 minutos para uso do link mágico após emissão.
_Avoid_: Link permanente, validade indefinida

**Uso Único do Link Mágico**:
Regra que invalida o link imediatamente após o primeiro uso bem-sucedido.
_Avoid_: Reuso do link, acesso repetível com mesmo token

## Relationships

- Um **Administrador** publica muitos **Stickers**
- O **Administrador Único** define que somente um **Administrador** gerencia o catálogo
- Cada **Cliente** possui exatamente um **E-mail Canônico do Cliente**
- Um **Sticker** pertence a pelo menos uma **Categoria de Sticker**
- Todo **Sticker** segue o **Padrão PNG Transparente**
- Todo **Sticker** respeita o **Limite de Tamanho de Sticker**
- Todo **Sticker** respeita a **Dimensão Mínima de Sticker**
- Todo **Sticker** segue a **Proporção Quadrada de Sticker**
- Um **Sticker** com erro é retirado por **Despublicação Imediata**
- O **E-mail Canônico do Cliente** só pode mudar via **Solicitação Formal de Troca de E-mail**
- A **Experiência Mobile-First** orienta as decisões de usabilidade da plataforma
- Uma **Compra Aprovada** cria ou renova uma **Assinatura**
- Uma **Assinatura Ativa** garante o **Acesso Ativo** de um **Cliente**
- A **Assinatura Ativa** concede **Catálogo Integral por Assinatura Ativa**
- O **Período de Carência** mantém o **Acesso Ativo** por tempo limitado após falha de renovação
- A **Reativação Automática de Acesso** acontece ao receber nova **Compra Aprovada**
- Toda **Compra Aprovada** deve vir de **Webhook Autenticado da Kiwify**
- O **Bloqueio por Estorno ou Chargeback** encerra o **Acesso Ativo** imediatamente
- O **Processamento Idempotente de Compra Aprovada** nunca cria dois **Clientes** para o mesmo **E-mail Canônico do Cliente**
- O **Limite de Sessões Simultâneas** controla quantos dispositivos podem manter acesso em paralelo
- Um **Cliente** com **Acesso Ativo** pode entrar via **Link Mágico de Acesso**
- O **Escopo da Primeira Entrega** contém login, galeria e detalhe de sticker
- O detalhe de cada **Sticker** expõe **Ações do Detalhe do Sticker**
- Todo **Link Mágico de Acesso** respeita a **Validade do Link Mágico**
- Todo **Link Mágico de Acesso** segue **Uso Único do Link Mágico**
- Um **Cliente** com **Acesso Ativo** encontra **Stickers** por **Categoria de Sticker** e **Busca Textual**
- As **Categorias Iniciais do MVP** são `Bom dia`, `Boa tarde` e `Boa noite`
- A **Cópia Nativa de Sticker** envia somente a imagem para a área de transferência
- O **Fallback de Cópia para Download** é acionado quando a cópia nativa não for suportada
- O **Fallback de Cópia para Download** exibe a **Instrução Padrão de Fallback**
- Um **Cliente** com **Acesso Ativo** pode copiar e baixar muitos **Stickers**
- O uso de **Stickers** segue a **Licença de Uso em Redes Sociais**
- Violação da **Licença de Uso em Redes Sociais** aciona **Bloqueio por Abuso de Licença**

## Example dialogue

> **Dev:** "Quando a Kiwify confirma o pagamento, já criamos o **Cliente** com **Acesso Ativo**?"
> **Domain expert:** "Sim, a **Compra Aprovada** deve liberar o acesso imediatamente."
> **Dev:** "No primeiro login, o **Cliente** recebe senha inicial?"
> **Domain expert:** "Não, o acesso inicial acontece por **Link Mágico de Acesso**."

## Flagged ambiguities

- "usuário" estava sendo usado para significar tanto visitante quanto comprador; resolução: no contexto, usamos **Cliente** apenas para comprador com acesso pago.
