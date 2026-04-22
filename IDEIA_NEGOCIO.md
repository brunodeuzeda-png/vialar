# Ferramenta de Gestão de Tarefas para Síndicos
> Plataforma de gestão proativa de demandas condominiais com IA no centro

---

## Visão Geral

Solução para síndicos e administradoras de condomínios terem interação proativa com tarefas e demandas — não só registrando chamados, mas antecipando, priorizando e comunicando.

---

## Módulos Essenciais

### 1. Central de Demandas (Core)
- Abertura de chamados por moradores (WhatsApp, app, portal web)
- Classificação automática por tipo (manutenção, financeiro, segurança, etc.)
- SLA por categoria com alertas de vencimento
- Histórico completo por unidade e por prestador

### 2. Painel do Síndico
- Dashboard: pendentes, em andamento, atrasados
- Alertas proativos ("3 demandas vencendo hoje")
- Termômetro de satisfação do condomínio
- Relatórios automáticos para assembleia

### 3. Comunicação Integrada
- Notificações automáticas ao morador sobre status
- Canal direto síndico ↔ administradora
- Avisos e circulares com confirmação de leitura
- Integração WhatsApp Business API

### 4. IA Proativa (diferencial)
- Triagem automática de demandas por urgência
- Sugestão de respostas para o síndico
- Detecção de padrões ("problemas elétricos no bloco B recorrentes")
- Resumo diário automático para o síndico
- Chatbot para moradores 24h

### 5. Gestão de Prestadores
- Cadastro de fornecedores por categoria
- Orçamentos vinculados à demanda
- Avaliação pós-serviço
- Controle de garantias

### 6. Financeiro Básico
- Prestação de contas simplificada
- Vinculação de gastos a demandas
- Aprovação de orçamentos com alçadas

### 7. Módulo de Compliance Regulatório ⭐
Mapa completo de obrigações com renovações periódicas — ver seção abaixo.

---

## Diferenciais Competitivos

| O que existe hoje | O que você entrega |
|---|---|
| Registro passivo de chamados | IA que prioriza e alerta proativamente |
| Comunicação por grupo de WhatsApp | Canal estruturado com histórico |
| Relatórios manuais | Relatórios automáticos com insights |
| Síndico reativo | Síndico informado antes do problema escalar |

---

## Stack Sugerida

- **Backend:** Node.js + Express + PostgreSQL
- **Frontend:** Next.js ou React SPA
- **IA:** Claude API (triagem, resumos, chatbot, sugestões)
- **Comunicação:** WhatsApp via Meta Cloud API ou Twilio
- **Hosting:** Render (backend) + Vercel (frontend)
- **Auth:** Clerk ou Supabase Auth

---

## MVP Recomendado (Fase 1)

1. Abertura de chamados via WhatsApp (morador envia mensagem → sistema registra)
2. Painel simples do síndico com lista de demandas + status
3. Notificação automática quando demanda muda de status
4. IA fazendo triagem e classificando urgência

---

## Modelo de Negócio

- **SaaS por condomínio:** R$ 150–400/mês (baseado em nº de unidades)
- **White label para administradoras:** plano enterprise com múltiplos condomínios
- **Setup fee:** cobrança única de onboarding

---

## Mapa de Obrigações Regulatórias

### 🔥 Segurança contra Incêndio e Pânico

| Obrigação | Periodicidade | Base Legal |
|---|---|---|
| AVCB — Auto de Vistoria do Corpo de Bombeiros | 1 a 3 anos (varia por estado) | Lei estadual + IT CBPMESP |
| Manutenção extintores (recarga) | 1 ano | ABNT NBR 12962 |
| Manutenção extintores (hidrostático) | 5 anos | ABNT NBR 12962 |
| Manutenção da rede de hidrantes | 1 ano | ABNT NBR 13714 |
| Teste de pressão das mangueiras | 1 ano | ABNT NBR 13714 |
| Inspeção sistema de alarme e detecção | 6 meses | ABNT NBR 17240 |
| Manutenção spinklers | 6 meses | ABNT NBR 10897 |
| Sinalização de emergência | 1 ano | ABNT NBR 13434 |
| Plano de emergência e abandono (simulacro) | 1 ano | IT 16 CBPMESP |
| Iluminação de emergência | 6 meses | ABNT NBR 10898 |

### 🏗️ Estrutura e Fachada

| Obrigação | Periodicidade | Base Legal |
|---|---|---|
| SPDA — Para-raios (inspeção) | 1 ano | ABNT NBR 5419 |
| Laudo de fachada | 5 anos | ABNT NBR 9575 + leis municipais |
| Laudo estrutural (prédios +20 anos) | 5 anos | ABNT NBR 6118 |
| Pintura de fachada | 5 a 8 anos | Convenção condominial |
| Impermeabilização de lajes e garagens | 5 anos (inspeção) | ABNT NBR 9575 |
| Inspeção de telhado e cobertura | 1 ano | ABNT NBR 15575 |
| Revisão de esquadrias e vedações | 2 anos | ABNT NBR 15575 |

### ⚡ Instalações Elétricas

| Obrigação | Periodicidade | Base Legal |
|---|---|---|
| Inspeção das instalações elétricas gerais | 1 ano | ABNT NBR 5410 |
| Laudo elétrico (SPDA + instalações) | 1 a 3 anos | ABNT NBR 5410 + 5419 |
| Manutenção do gerador | 6 meses | Manual do fabricante |
| Inspeção de subestação | 1 ano | NR-10 |
| Termografia elétrica | 1 ano | ABNT NBR 15572 |
| Revisão de DPS | 1 ano | ABNT NBR 5410 |

### 🛗 Elevadores

| Obrigação | Periodicidade | Base Legal |
|---|---|---|
| Contrato de manutenção preventiva | Mensal (obrigatório) | ABNT NBR 5665 + lei municipal |
| Relatório de manutenção | Mensal | ABNT NBR 16083 |
| Vistoria pelo poder público | 1 a 2 anos | Lei municipal |
| Renovação da carteira do elevador | Anual ou bianual | Secretaria Municipal |
| Inspeção de segurança anual | 1 ano | ABNT NBR 16083 |

### 💧 Instalações Hidráulicas e Gás

| Obrigação | Periodicidade | Base Legal |
|---|---|---|
| Limpeza e desinfecção de caixas d'água | 6 meses | Portaria MS 888/2021 |
| Laudo de potabilidade da água | 6 meses | Portaria MS 888/2021 |
| Inspeção da rede de gás | 1 ano | ABNT NBR 13523 + 15526 |
| Teste de estanqueidade da rede de gás | 1 a 3 anos | ABNT NBR 15526 |
| Manutenção de bombas hidráulicas | 6 meses | Manual do fabricante |
| Inspeção de tubulações hidráulicas | 5 anos | ABNT NBR 5626 |
| Central de GLP (manutenção) | 6 meses | ABNT NBR 13523 |

### 🧹 Serviços e Meio Ambiente

| Obrigação | Periodicidade | Base Legal |
|---|---|---|
| Dedetização e controle de pragas | 6 meses a 1 ano | Vigilância sanitária local |
| Limpeza de caixas de gordura | 3 a 6 meses | ABNT NBR 8160 |
| Limpeza de fossas | 1 a 2 anos | Norma municipal |
| Descarte de lâmpadas e pilhas | Contínuo | Lei 12.305/2010 (PNRS) |

### 📄 Documentos e Obrigações Legais/Fiscais

| Obrigação | Periodicidade | Base Legal |
|---|---|---|
| Prestação de contas aos condôminos | Mensal | CC Art. 1348 |
| Assembleia Geral Ordinária (AGO) | 1 ano | CC Art. 1350 |
| RAIS (se houver funcionários) | Anual (até abril) | Lei 7.998/90 |
| eSocial — folha de pagamento | Mensal | Resolução CGSN |
| Seguro condominial obrigatório | 1 ano | CC Art. 1346 |
| Renovação do alvará de funcionamento | 1 ano | Prefeitura local |
| NR-35 (trabalho em altura) — treinamento | 2 anos | NR-35 MTE |
| NR-10 (elétrica) — treinamento funcionários | 2 anos | NR-10 MTE |
| PCMSO (saúde funcionários) | 1 ano | NR-7 MTE |
| PPRA/PGR (riscos ambientais) | 1 ano | NR-9/NR-1 MTE |

### 🔒 Segurança Patrimonial e Sistemas

| Obrigação | Periodicidade | Base Legal |
|---|---|---|
| Manutenção sistema CFTV | 6 meses | LGPD |
| Revisão de controle de acesso | 1 ano | Norma interna |
| Adequação à LGPD (câmeras/dados) | Revisão anual | Lei 13.709/2018 |
| Manutenção de interfone/porteiro | 1 ano | Manual fabricante |

---

## Riscos por Não Conformidade

- **Jurídicos:** Responsabilização civil e criminal do síndico em caso de acidente
- **Financeiros:** Multas de R$ 500 a R$ 50.000+
- **Operacionais:** Interdição do elevador, embargo de obra, cassação do AVCB
- **Seguros:** Seguradora pode negar sinistro se obrigação estiver vencida

---

## Implementação do Módulo de Compliance

1. Cadastro do condomínio com características → sistema pré-popula obrigações aplicáveis
2. Calendário regulatório com alertas em 90, 30 e 7 dias antes do vencimento
3. Upload de documentos com OCR para extrair data de validade automaticamente
4. Semáforo de conformidade (verde/amarelo/vermelho) no dashboard
5. Relatório de conformidade exportável em PDF para assembleia
6. IA analisando documentos enviados e validando se estão dentro do prazo
