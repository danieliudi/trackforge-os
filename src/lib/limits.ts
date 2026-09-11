/**
 * Limites de entrada compartilhados entre a bancada e as rotas de API.
 *
 * A UI (`OriginPicker`) já corta neste teto. Sem o mesmo limite no Zod, um
 * `curl` manda megabytes e a conta da Anthropic paga a diferença.
 */
export const MAX_INPUT_CHARS = 40_000;
export const MAX_CONTEXT_CHARS = 20_000;
export const MAX_SEARCH_QUERY_CHARS = 200;
