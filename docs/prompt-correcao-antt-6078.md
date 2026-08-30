# Prompt — correção da ANTT 6.078/2026

Cole no chat com as skills Resibag carregadas. É autocontido: não depende do
histórico da sessão onde o erro foi encontrado.

---

Preciso corrigir um erro de fato normativo que está propagado nas skills da
Resibag, e depois rodar o Protocolo de Propagação até o fim.

**O erro, confirmado por mim (Daniel Yano, 29/08/2026):**

A `resibag-compliance-kb` v3.3 tem a seção "2. ANTT 5998/2022 + ANTT 6.078/2026 —
Transporte Rodoviário", que apresenta a **Resolução ANTT nº 6.078/2026 como
atualização da Resolução nº 5.998/2022**, listando como mudanças: ajustes em
declarações eletrônicas, fiscalização cruzada com IBAMA, integração de MTR-e e
critérios de reclassificação de embalagens.

Isso está errado. **A 6.078/2026 não substituiu nem atualizou a 5.998/2022.** São
resoluções que tratam de assuntos totalmente diferentes dentro do setor de
transportes. A 5.998/2022 continua sendo a norma-base de transporte rodoviário de
produtos perigosos, e é ela — sozinha — que sustenta o argumento de compliance da
Resibag nesse tema.

**O que eu quero que você faça, nesta ordem:**

1. **Não invente o substituto.** Você não sabe o que a 6.078/2026 trata de fato, e
   eu também não confirmei. Não escreva uma descrição plausível. Se não der para
   verificar em fonte primária, a menção sai e não entra nada no lugar.

2. **Verifique em fonte primária antes de escrever qualquer coisa nova.** Só vale
   gov.br/antt, Diário Oficial ou o texto da resolução. Blog, portal de notícias,
   escritório de advocacia e resumo de associação **não** servem para fixar o fato —
   servem, no máximo, para achar o caminho até a fonte primária. Me diga
   explicitamente qual fonte você usou e cole o link.

3. **Corrija a `resibag-compliance-kb`:**
   - Renomeie a seção 2 para tratar apenas da ANTT 5998/2022.
   - Remova o bloco "ANTT 6.078/2026 (atualização recente)" e as quatro mudanças
     listadas nele.
   - Se a verificação em fonte primária mostrar que a 6.078/2026 tem alguma
     relevância real para embalagem de resíduo perigoso, abra uma seção própria
     dizendo o que ela é de verdade, com link. Se não tiver, ela simplesmente não
     aparece na KB.
   - Bump de versão + changelog explicando a correção e a causa.

4. **Corrija a `resibag-canonical-facts`:** a tabela da seção "05 · Certificações
   Oficiais" lista `ANTT 6.078/2026 — Atualização de transporte rodoviário` como
   certificação aplicável a Standard e Estruturado. Remova essa linha. Bump +
   changelog.

5. **Rode o Protocolo de Propagação** da `resibag-canonical-facts`, sem pular etapa:
   - Grep por `6.078`, `6078` e "atualização de transporte rodoviário" em **todas**
     as skills consumidoras: `resibag-atendimento-agent`, `resibag-compliance-kb`,
     `resibag-cowork-ops`, `resibag-crm-ops`, `resibag-growth-engine`,
     `resibag-lead-qualifier`, `resibag-sales-copilot`. Grep no arquivo inteiro,
     não só no cabeçalho — o protocolo registra pelo menos um caso em que a
     referência estava escondida dentro de um template de system prompt em produção.
   - Notion, vault `01_RESIBAG`: página raiz, database Regulations, database
     Concepts (campo Source, todas as entries), Decisions Log, Sources & References.
   - Google Drive: buscar `fullText contains 'Resibag'` + `6.078`. Documento
     desatualizado que você não for reescrever, renomear com `[SUPERADO]` no título.

6. **Novo consumidor que ainda não está no protocolo:** o app `carousel-builder`
   (repo `danieliudi/carousel-builder`) mantém uma cópia curada dessas duas skills
   em `src/knowledge/resibag.ts`, e é o que alimenta o gerador de carrossel. **Essa
   cópia já foi corrigida** — a menção à 6.078 foi removida e virou proibição
   explícita. Não precisa mexer, mas **inclua o `carousel-builder` na lista de
   consumidores** do Protocolo de Propagação da `resibag-canonical-facts`, para a
   próxima correção não esquecer dele.

7. **No fim, me entregue:**
   - a fonte primária que você consultou, com link;
   - a lista de cada arquivo/página tocada e o que mudou em cada um;
   - a lista do que você procurou e **não** achou (isso vale tanto quanto o que
     achou — é o que me diz que a varredura foi completa);
   - qualquer outro lugar onde a 6.078 apareça que eu não tenha listado aqui.

**Regra que vale para a tarefa inteira:** se em algum ponto você não tiver fonte
primária para afirmar algo, escreva "não verificado" e me pergunte. Este erro
sobreviveu porque uma descrição plausível foi escrita sem fonte e ninguém
questionou depois.
