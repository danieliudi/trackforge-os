import { NextResponse, type NextRequest } from "next/server";

/**
 * Senha na frente do app.
 *
 * Em `localhost` / `127.0.0.1` a senha continua opcional: exigir login para
 * `npm run dev` seria atrito puro. Fora disso — URL pública, preview, produção —
 * `APP_PASSWORD` é obrigatória. Sem ela o proxy responde 503 e nada passa:
 * as quatorze rotas de API gastam a chave da Anthropic, leem sinais do CRM,
 * escrevem na fila de aprovação e apagam arquivo da biblioteca.
 *
 * É Basic Auth de propósito: sem tela de login para manter, sem sessão para
 * expirar, e o navegador guarda. Não é controle de acesso por usuário — é uma
 * porta trancada.
 *
 * O arquivo se chama `proxy` e não `middleware` porque o Next 16 renomeou a
 * convenção; a versão com o nome antigo funciona e avisa que vai sair.
 */

const REALM = 'Basic realm="Trackforge OS", charset="UTF-8"';

function hostLocal(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname === "::1"
  );
}

/** Comparação de tamanho fixo: sai depois de olhar tudo, não no primeiro erro. */
function mesmaSenha(recebida: string, esperada: string): boolean {
  if (recebida.length !== esperada.length) return false;
  let diferenca = 0;
  for (let i = 0; i < recebida.length; i += 1) {
    diferenca |= recebida.charCodeAt(i) ^ esperada.charCodeAt(i);
  }
  return diferenca === 0;
}

export function proxy(request: NextRequest) {
  const esperada = process.env.APP_PASSWORD;
  const local = hostLocal(request.nextUrl.hostname);

  if (!esperada) {
    // Fail-closed fora de localhost: URL pública sem senha deixa a ferramenta
    // aberta. Em localhost o atrito de exigir senha no `npm run dev` não paga.
    if (local) return NextResponse.next();
    return new NextResponse(
      "APP_PASSWORD não configurada. Defina a variável antes de expor esta URL.",
      { status: 503 },
    );
  }

  const header = request.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      // Senha pode conter `:`; tudo depois do primeiro `:` é a senha.
      const colon = decoded.indexOf(":");
      const senha = colon === -1 ? decoded : decoded.slice(colon + 1);
      if (mesmaSenha(senha, esperada)) return NextResponse.next();
    } catch {
      // Cabeçalho malformado cai no 401 abaixo.
    }
  }

  return new NextResponse("Acesso restrito.", {
    status: 401,
    headers: { "WWW-Authenticate": REALM },
  });
}

export const config = {
  // Tudo menos os estáticos do Next e o favicon: as rotas de API são
  // justamente o que precisa da guarda, então elas NÃO ficam de fora.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
