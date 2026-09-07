# Diretrizes de UI — TrackForge OS

**Aprovado em 04/09/2026** (mockup `scratchpad/painel-mockup.html` + painel Situação em `/`).

Esta é a **identidade visual da plataforma inteira**. Tela nova, redesign e
qualquer mudança de aparência seguem isto. Não invente um segundo visual.

A referência canônica de proporção e densidade é o painel de Situação. A
bancada (`/esteira`) e o editor de slides continuam sendo superfícies de
*trabalho* (três colunas / canvas), mas herdam os mesmos tokens, tipografia,
casca e estados vazios.

---

## 1. O que nunca muda

| Regra | Onde |
|---|---|
| Tokens Clockwork (`canvas`, `surface`, `acc`, `ok`, `warn`…) | `src/app/globals.css` |
| Classes de UI (`panelClass`, `labelClass`, `metaClass`, `fieldClass`, `focusRing`) | `src/lib/ui.ts` |
| Botões | `src/components/ui/Button.tsx` |
| Casca (frente + seções + tema) | `src/components/app/EsteiraShell.tsx` |
| Tema `sistema` / `claro` / `escuro` | `src/lib/theme.ts` + script em `layout.tsx` |

**Proibido:** hex, `rgb()`, escala Tailwind (`zinc-*`, `white`, `slate-*`) em
arquivo de tela. Hex da referência Sanwey OS / Worktail (`#F9F5F1`, `#B62D2C`,
`#F4F1EA`, `#FF5722`) **não entra** — mapeia para o token Clockwork equivalente.

## 2. Anatomia de uma tela de leitura / painel

Toda tela que não é a bancada de três colunas nem o editor de slides:

1. **`EsteiraShell`** — nunca invente outra casca.
2. **Cabeçalho de página:** `labelClass` (seção) → `h1` (título) → uma frase em
   `text-[13px] text-mut` (o que a tela decide).
3. **Largura:** `ShellPage` e painéis usam `max-w-[1440px]` com
   `px-6 py-6 md:px-8` — a mesma largura da Situação. Não volte para `max-w-5xl`
   em tela de listagem.
4. **Superfície:** bloco agrupado = `panelClass` (`rounded-lg border border-line2 bg-surface`).
5. **Vazio:** `border border-dashed border-line` + texto `text-[12.5px] text-mut`.
   Nunca invente um empty state decorado.
6. **Atenção:** ponto de status `h-2 w-2 rounded-full` nas cores `acc` / `ok` /
   `warn` / `danger` — não use pill colorida de marca.
7. **Métrica grande:** `tabular-nums`, tracking apertado, ~28–32px, peso bold.
8. **Percentual:** sempre com o `n` ao lado (`n=12`). Número sozinho mente.

## 3. Grades (quando a tela é um painel)

Espelhar a Situação quando houver KPIs / charts / listas:

```
kpi:     grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4
charts:  grid grid-cols-1 lg:grid-cols-2 gap-4
widgets: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4
```

Card de KPI urgente (ação imediata): `border-acc bg-acc` com letra `acc-ink`
(quase-preto). **Nunca** texto branco sobre o laranja — contraste reprova.

## 4. Gráficos

- Biblioteca: **Recharts**.
- Cores: `var(--color-acc)`, `var(--color-ok)`, `var(--color-line2)` — nunca hex.
- Tooltip: superfície `panelClass`, tipografia mono para valor.
- Hover obrigatório; gráfico estático não passa.

Componentes reutilizáveis em `src/components/dashboard/` — importe, não copie.

## 5. Navegação

Seções do topo (ordem):

`Situação` (`/`) · `Peças` · `Fatos` · `Custos` · `Instalação`

- Home = Situação. Bancada = `/esteira`.
- Link “Trackforge OS” na marca leva à Situação (`/`).
- Rotas órfãs legadas (`/artigo`, `/esteira/avulso`) redirecionam; não ganham
  item de menu. `/slides-preview` continua lab, fora do menu.

## 6. O que esta identidade **não** é

- Não é cream + terracotta de referência externa.
- Não é vermelho institucional Sanwey OS (`#B62D2C`) nesta ferramenta — o acento
  da esteira é o laranja Clockwork (`acc`).
- Não é dashboard de marketing/CRM. Desempenho de lead fica no CRM; aqui é
  produção, custo e fila.
- Não é card com sombra multi-camada, glow, pill cluster nem ícone row decorativo.

## 7. Portão

Mudou aparência ou organização → mockup HTML clicável (3–4 estados) a 1900px,
**conferido contra estas diretrizes**, aprovado pelo Daniel antes do código.
Screenshot da entrega se mede contra o mockup **e** contra este arquivo.

Referências vivas:

- Mockup aprovado: `scratchpad/painel-mockup.html`
- Spec de slots do painel: `docs/dashboard-spec.json`
- Implementação de referência: `src/app/page.tsx` + `src/components/dashboard/`
