import { NextResponse, type NextRequest } from "next/server";

/**
 * Senha na frente do app — só quando existe uma senha configurada.
 *
 * POR QUE OPCIONAL: em `localhost` não há de quem se proteger, e exigir login
 * para rodar `npm run dev` seria atrito puro. Mas as doze rotas de API gastam a
 * chave da Anthropic, leem sinais do CRM, escrevem na fila de aprovação e
 * apagam arquivo da biblioteca — no dia em que isto ganhar uma URL pública sem
 * nada na frente, quem souber o endereço faz tudo isso.
 *
 * Então: sem `APP_PASSWORD`, nada muda. Com ela, toda requisição precisa da
 * senha. A hospedagem é o lugar onde a variável é definida, e é lá que o risco
 * existe.
 *
 * É Basic Auth de propósito: sem tela de login para manter, sem sessão para
 * expirar, e o navegador guarda. Não é controle de acesso por usuário — é uma
 * porta trancada, que é o que falta hoje.
 *
 * O arquivo se chama `proxy` e não `middleware` porque o Next 16 renomeou a
 * convenção; a versão com o nome antigo funciona e avisa que vai sair.
 */

const REALM = 'Basic realm="Trackforge OS", charset="UTF-8"';

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
  if (!esperada) return NextResponse.next();

  const header = request.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    try {
      const [, senha = ""] = atob(header.slice(6)).split(":");
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
