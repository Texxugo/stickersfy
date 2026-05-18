# Kiwify por webhook autenticado com processamento idempotente

A plataforma aceitará eventos de cobrança apenas via webhook autenticado da Kiwify e processará `Compra Aprovada` com idempotência por e-mail canônico do cliente. Essa decisão reduz risco de fraude, evita duplicidade de contas em reentregas de evento e mantém reativação automática confiável após inadimplência.
