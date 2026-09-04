import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Gate de publicação — roda no `prebuild`, bloqueando.
 *
 * POR QUE EXISTE: até 03/09/2026 não havia NENHUMA verificação bloqueante entre
 * escrever o código e publicar. O `prebuild` rodava só o aviso de drift da base
 * de fatos, que sai sempre com 0 de propósito; esta configuração era o preset do
 * Next sem nenhuma regra escolhida; e o Next deixou de rodar ESLint dentro do
 * `build`. As três coisas somadas deixavam a porta aberta.
 *
 * O ACHADO QUE MUDOU O REMÉDIO: sondando as classes de erro uma a uma,
 * `react-hooks/rules-of-hooks` JÁ era erro aqui, pelos presets — hook dentro de
 * `if` e hook dentro de laço são pegos. A regra funcionava; ninguém a executava
 * antes de publicar. Ou seja, o ganho maior não veio de configurar regra nova,
 * veio de ligar o lint no `prebuild`. As regras abaixo são só o resto do buraco.
 *
 * CRITÉRIO: só entra regra que pega erro de EXECUÇÃO. Zero regra de estilo, de
 * propósito — gate que apita por formatação vira gate ignorado, e aí não segura
 * mais nada. Ruído que não quebra nada (variável não usada, dependência
 * incompleta) continua como AVISO e sai em `npm run lint:ruido`, que não trava
 * o build.
 *
 * O QUE O TypeScript JÁ COBRE, e por isso ficou de fora (sondado, não suposto):
 *   - chave duplicada em objeto ......... TS1117
 *   - variável usada antes de declarar ... TS2448 + TS2454
 *   - negação insegura (`!k in o`) ....... TS2322, porque o código é todo tipado
 *   - membro duplicado de classe ......... TS2393
 * Repetir essas no ESLint só faria o gate demorar mais para dizer o mesmo.
 */
const gateDeExecucao = {
  rules: {
    // Condição que nunca faz o que parece. `if (n || true)` e `x === x` passam
    // pelo compilador inteiros e o teste não pega, porque o ramo "errado"
    // simplesmente nunca roda.
    "no-constant-condition": "error",
    "no-constant-binary-expression": "error",
    "no-self-compare": "error",

    // Duplicação silenciosa: o segundo ramo é inalcançável e não há aviso
    // nenhum. Foi essa classe que matou tela no repositório irmão.
    "no-dupe-else-if": "error",
    "no-duplicate-case": "error",

    // Promessa ignorada dentro de callback de efeito ou handler: o erro some e
    // a tela fica num estado que ninguém sabe explicar depois.
    "no-async-promise-executor": "error",
    "require-atomic-updates": "off", // falso positivo demais com React 19
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  gateDeExecucao,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Roteiros de teste e de medição: rodam fora do app, com estilo próprio.
    "scratchpad/**",
  ]),
]);

export default eslintConfig;
