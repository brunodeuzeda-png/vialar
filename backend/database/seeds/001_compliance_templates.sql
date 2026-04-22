INSERT INTO compliance_obligation_templates (code, name, description, legal_basis, category, frequency, alert_days) VALUES

-- SEGURANÇA CONTRA INCÊNDIO
('AVCB', 'AVCB — Auto de Vistoria do Corpo de Bombeiros', 'Vistoria obrigatória do Corpo de Bombeiros', 'Lei estadual + IT CBPMESP', 'SEGURANCA_INCENDIO', 'ANUAL', '{90,30,7}'),
('EXT_RECARGA', 'Recarga de extintores', 'Recarga anual obrigatória', 'ABNT NBR 12962', 'SEGURANCA_INCENDIO', 'ANUAL', '{90,30,7}'),
('EXT_HIDRO', 'Teste hidrostático de extintores', 'Teste a cada 5 anos', 'ABNT NBR 12962', 'SEGURANCA_INCENDIO', 'QUINQUENAL', '{90,30,7}'),
('HIDRANTE', 'Manutenção da rede de hidrantes', 'Inspeção e manutenção anual', 'ABNT NBR 13714', 'SEGURANCA_INCENDIO', 'ANUAL', '{90,30,7}'),
('MANGUEIRAS', 'Teste de pressão das mangueiras', 'Teste hidrostático anual', 'ABNT NBR 13714', 'SEGURANCA_INCENDIO', 'ANUAL', '{90,30,7}'),
('ALARME', 'Inspeção do sistema de alarme e detecção', 'Manutenção semestral', 'ABNT NBR 17240', 'SEGURANCA_INCENDIO', 'SEMESTRAL', '{60,30,7}'),
('SPRINKLER', 'Manutenção de sprinklers', 'Inspeção semestral', 'ABNT NBR 10897', 'SEGURANCA_INCENDIO', 'SEMESTRAL', '{60,30,7}'),
('SINALIZACAO', 'Revisão da sinalização de emergência', 'Verificação anual', 'ABNT NBR 13434', 'SEGURANCA_INCENDIO', 'ANUAL', '{90,30,7}'),
('SIMULACRO', 'Plano de emergência — simulacro', 'Simulacro anual obrigatório', 'IT 16 CBPMESP', 'SEGURANCA_INCENDIO', 'ANUAL', '{90,30,7}'),
('ILUM_EMERG', 'Iluminação de emergência', 'Inspeção semestral', 'ABNT NBR 10898', 'SEGURANCA_INCENDIO', 'SEMESTRAL', '{60,30,7}'),

-- ESTRUTURA E FACHADA
('SPDA', 'SPDA — Para-raios (inspeção)', 'Inspeção anual do sistema de proteção', 'ABNT NBR 5419', 'ESTRUTURA', 'ANUAL', '{90,30,7}'),
('LAUDO_FACHADA', 'Laudo de fachada', 'Inspeção quinquenal obrigatória', 'ABNT NBR 9575 + leis municipais', 'ESTRUTURA', 'QUINQUENAL', '{180,90,30}'),
('LAUDO_ESTRUTURAL', 'Laudo estrutural', 'Prédios com mais de 20 anos', 'ABNT NBR 6118', 'ESTRUTURA', 'QUINQUENAL', '{180,90,30}'),
('IMPERMEABILIZACAO', 'Inspeção de impermeabilização', 'Lajes e garagens', 'ABNT NBR 9575', 'ESTRUTURA', 'QUINQUENAL', '{180,90,30}'),
('TELHADO', 'Inspeção de telhado e cobertura', 'Inspeção anual', 'ABNT NBR 15575', 'ESTRUTURA', 'ANUAL', '{90,30,7}'),
('ESQUADRIAS', 'Revisão de esquadrias e vedações', 'A cada dois anos', 'ABNT NBR 15575', 'ESTRUTURA', 'BIENAL', '{90,30,7}'),

-- INSTALAÇÕES ELÉTRICAS
('INSP_ELETRICA', 'Inspeção das instalações elétricas', 'Inspeção anual geral', 'ABNT NBR 5410', 'ELETRICA', 'ANUAL', '{90,30,7}'),
('LAUDO_ELETRICO', 'Laudo elétrico completo', 'SPDA + instalações', 'ABNT NBR 5410 + 5419', 'ELETRICA', 'ANUAL', '{90,30,7}'),
('GERADOR', 'Manutenção do gerador', 'Semestral conforme fabricante', 'Manual do fabricante', 'ELETRICA', 'SEMESTRAL', '{60,30,7}'),
('SUBESTACAO', 'Inspeção de subestação', 'Anual conforme NR-10', 'NR-10', 'ELETRICA', 'ANUAL', '{90,30,7}'),
('TERMOGRAFIA', 'Termografia elétrica', 'Inspeção termográfica anual', 'ABNT NBR 15572', 'ELETRICA', 'ANUAL', '{90,30,7}'),

-- ELEVADORES
('ELEV_MANUT', 'Manutenção preventiva de elevadores', 'Contrato mensal obrigatório', 'ABNT NBR 5665 + lei municipal', 'ELEVADORES', 'MENSAL', '{15,7,3}'),
('ELEV_VISTORIA', 'Vistoria oficial de elevadores', 'Vistoria pelo poder público', 'Lei municipal', 'ELEVADORES', 'ANUAL', '{90,30,7}'),
('ELEV_CARTEIRA', 'Renovação da carteira do elevador', 'Renovação anual', 'Secretaria Municipal', 'ELEVADORES', 'ANUAL', '{90,30,7}'),

-- HIDRÁULICA E GÁS
('CAIXA_AGUA', 'Limpeza e desinfecção de caixas d''água', 'Semestral obrigatória', 'Portaria MS 888/2021', 'HIDRAULICA', 'SEMESTRAL', '{60,30,7}'),
('POTABILIDADE', 'Laudo de potabilidade da água', 'Análise semestral', 'Portaria MS 888/2021', 'HIDRAULICA', 'SEMESTRAL', '{60,30,7}'),
('INSP_GAS', 'Inspeção da rede de gás', 'Inspeção anual', 'ABNT NBR 13523 + 15526', 'GAS', 'ANUAL', '{90,30,7}'),
('TESTE_GAS', 'Teste de estanqueidade da rede de gás', 'A cada 1 a 3 anos', 'ABNT NBR 15526', 'GAS', 'ANUAL', '{90,30,7}'),
('BOMBAS', 'Manutenção de bombas hidráulicas', 'Semestral', 'Manual do fabricante', 'HIDRAULICA', 'SEMESTRAL', '{60,30,7}'),
('GLP_CENTRAL', 'Manutenção da central de GLP', 'Semestral', 'ABNT NBR 13523', 'GAS', 'SEMESTRAL', '{60,30,7}'),

-- SERVIÇOS E MEIO AMBIENTE
('DEDETIZACAO', 'Dedetização e controle de pragas', 'Semestral mínimo', 'Vigilância sanitária', 'SERVICOS', 'SEMESTRAL', '{60,30,7}'),
('CAIXA_GORDURA', 'Limpeza de caixas de gordura', 'Trimestral a semestral', 'ABNT NBR 8160', 'SERVICOS', 'TRIMESTRAL', '{30,15,7}'),
('FOSSA', 'Limpeza de fossas', 'Anual a bienal', 'Norma municipal', 'SERVICOS', 'ANUAL', '{90,30,7}'),

-- DOCUMENTOS LEGAIS E FISCAIS
('AGO', 'Assembleia Geral Ordinária (AGO)', 'Obrigatória anualmente', 'CC Art. 1350', 'LEGAL', 'ANUAL', '{90,30,14}'),
('SEGURO', 'Renovação do seguro condominial', 'Seguro obrigatório anual', 'CC Art. 1346', 'LEGAL', 'ANUAL', '{90,30,7}'),
('RAIS', 'RAIS — Relação Anual de Informações Sociais', 'Até abril, se houver funcionários', 'Lei 7.998/90', 'TRABALHISTA', 'ANUAL', '{90,30,7}'),
('PCMSO', 'PCMSO — Programa de Controle Médico', 'Renovação anual', 'NR-7 MTE', 'TRABALHISTA', 'ANUAL', '{90,30,7}'),
('PGR', 'PGR — Programa de Gerenciamento de Riscos', 'Renovação anual', 'NR-1/NR-9 MTE', 'TRABALHISTA', 'ANUAL', '{90,30,7}'),
('NR35', 'NR-35 — Treinamento trabalho em altura', 'A cada dois anos', 'NR-35 MTE', 'TRABALHISTA', 'BIENAL', '{90,30,7}'),
('NR10', 'NR-10 — Treinamento segurança elétrica', 'A cada dois anos', 'NR-10 MTE', 'TRABALHISTA', 'BIENAL', '{90,30,7}'),

-- SEGURANÇA PATRIMONIAL
('CFTV', 'Manutenção do sistema CFTV', 'Semestral + adequação LGPD', 'Lei 13.709/2018', 'SEGURANCA_PATRIMONIAL', 'SEMESTRAL', '{60,30,7}'),
('CONTROLE_ACESSO', 'Revisão do controle de acesso', 'Anual', 'Norma interna', 'SEGURANCA_PATRIMONIAL', 'ANUAL', '{90,30,7}'),
('LGPD', 'Revisão de adequação LGPD', 'Câmeras e dados pessoais', 'Lei 13.709/2018', 'SEGURANCA_PATRIMONIAL', 'ANUAL', '{90,30,7}'),
('INTERFONE', 'Manutenção de interfone/porteiro eletrônico', 'Anual', 'Manual fabricante', 'SEGURANCA_PATRIMONIAL', 'ANUAL', '{90,30,7}');
