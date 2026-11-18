// Gera o site estático (site/) com as publicações aprovadas ou publicadas
// e as prévias de aprovação (rascunhos/) das publicações pendentes.
// Uso: node src/build.mjs

import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { legendaInstagram, MARCADOR_LINK, validar } from "./validar.mjs";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const lerJson = async (caminho) => JSON.parse(await readFile(join(raiz, caminho), "utf8"));

const monogramaBase64 = (await readFile(join(raiz, "src", "assets", "monograma-suave.png"))).toString("base64");
const escritorio = await lerJson("content/escritorio.json");
const publicacoes = await lerJson("content/publicacoes.json");

const NO_SITE = new Set(["aprovada", "publicada"]);
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

const escapar = (texto) =>
  String(texto).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const dataExtensa = (iso) => {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return `${dia} de ${MESES[mes - 1]} de ${ano}`;
};
const dataCurta = (iso) => iso.split("-").reverse().join("/");

function markdownParaHtml(texto) {
  const blocos = texto.trim().split(/\n{2,}/);
  return blocos
    .map((bloco) => {
      if (bloco.startsWith("#### ")) return `<h2>${escapar(bloco.slice(5))}</h2>`;
      if (bloco.split("\n").every((linha) => linha.startsWith("- "))) {
        const itens = bloco.split("\n").map((linha) => `<li>${escapar(linha.slice(2))}</li>`);
        return `<ul>${itens.join("")}</ul>`;
      }
      return `<p>${escapar(bloco).replaceAll("\n", "<br>")}</p>`;
    })
    .join("\n");
}

const urlPost = (pub, base = "") => `${base}/blog/${pub.slug}/`;

function canaisHtml(prefixo) {
  const rotulos = {
    facebook: "Facebook",
    instagram: "Instagram",
    googleMeuNegocio: "Google Meu Negócio",
    whatsapp: "WhatsApp",
  };
  const links = Object.entries(rotulos)
    .filter(([chave]) => escritorio.canais[chave])
    .map(
      ([chave, rotulo]) =>
        `<li><a href="${escapar(escritorio.canais[chave])}" rel="noopener" target="_blank">${rotulo}</a></li>`,
    );
  if (links.length === 0) return "";
  return `<nav class="canais" aria-label="Canais do escritório"><h2 class="${prefixo}">Canais</h2><ul>${links.join("")}</ul></nav>`;
}

function pagina({ titulo, descricao, conteudo, profundidade = 0, canonica = null }) {
  const sobe = profundidade === 0 ? "." : Array(profundidade).fill("..").join("/");
  const tituloCompleto = titulo ? `${titulo} · ${escritorio.nome}` : `${escritorio.nome} · ${escritorio.titulo}`;
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapar(tituloCompleto)}</title>
<meta name="description" content="${escapar(descricao)}">
<meta property="og:title" content="${escapar(titulo ?? escritorio.nome)}">
<meta property="og:description" content="${escapar(descricao)}">
<meta property="og:type" content="${profundidade > 1 ? "article" : "website"}">
${canonica ? `<link rel="canonical" href="${escapar(canonica)}">` : ""}
<link rel="icon" href="${sobe}/assets/icone.png" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Lato:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${sobe}/assets/estilo.css">
</head>
<body>
<div class="moldura">
<header class="topo">
  <a class="marca" href="${sobe}/">
    <img src="${sobe}/assets/icone.png" alt="" width="56" height="56">
    <span><strong>${escapar(escritorio.nome)}</strong><small>${escapar(escritorio.titulo)} · ${escapar(escritorio.oab)}</small></span>
  </a>
  <nav class="menu" aria-label="Principal">
    <a href="${sobe}/">Início</a>
    <a href="${sobe}/blog/">Blog</a>
  </nav>
</header>
<main>
${conteudo}
</main>
<footer class="rodape">
  ${canaisHtml("rodape-titulo")}
  <address>
    <strong>${escapar(escritorio.nome)}</strong> · ${escapar(escritorio.titulo)} · ${escapar(escritorio.oab)}<br>
    ${escapar(escritorio.endereco)}<br>
    Celular ${escapar(escritorio.celular)} · Telefone ${escapar(escritorio.telefone)}<br>
    <a href="mailto:${escapar(escritorio.email)}">${escapar(escritorio.email)}</a>
  </address>
  <p class="aviso">Os conteúdos deste site são apenas informativos e não substituem a análise de um caso concreto.</p>
</footer>
</div>
</body>
</html>
`;
}

function cartaoPost(pub, sobe) {
  return `<article class="cartao">
  <p class="meta"><span class="area">${escapar(pub.area)}</span> · <time datetime="${pub.dataPublicacao}">${dataExtensa(pub.dataPublicacao)}</time></p>
  <h3><a href="${sobe}/blog/${pub.slug}/">${escapar(pub.titulo)}</a></h3>
  <p>${escapar(pub.descricao)}</p>
</article>`;
}

function listaPosts(posts, sobe) {
  if (posts.length === 0) {
    return `<p class="vazio">As primeiras publicações informativas aparecerão aqui em breve.</p>`;
  }
  return `<div class="lista">${posts.map((pub) => cartaoPost(pub, sobe)).join("\n")}</div>`;
}

function fontesHtml(pub) {
  const itens = pub.fontes.map(
    (fonte) =>
      `<li>${escapar(fonte.orgao)}, “<a href="${escapar(fonte.url)}" rel="noopener" target="_blank">${escapar(fonte.titulo)}</a>”, publicada em ${dataCurta(fonte.data)}.</li>`,
  );
  return `<section class="fontes"><h2>Fonte</h2><ul>${itens.join("")}</ul></section>`;
}

function paginaPost(pub, profundidade = 2) {
  const sobe = Array(profundidade).fill("..").join("/");
  const canonica = escritorio.siteUrl ? urlPost(pub, escritorio.siteUrl.replace(/\/$/, "")) : null;
  const conteudo = `<article class="post">
  <p class="meta"><a href="${sobe}/blog/">Blog</a> · <span class="area">${escapar(pub.area)}</span> · <time datetime="${pub.dataPublicacao}">${dataExtensa(pub.dataPublicacao)}</time></p>
  <h1>${escapar(pub.titulo)}</h1>
  <p class="descricao">${escapar(pub.descricao)}</p>
  <div class="texto">
${markdownParaHtml(pub.corpo)}
  </div>
  ${fontesHtml(pub)}
</article>`;
  return pagina({ titulo: pub.titulo, descricao: pub.descricao, conteudo, profundidade, canonica });
}

function paginaInicial(posts) {
  const areas = escritorio.areas
    .map((area) => `<li><h3>${escapar(area.nome)}</h3><p>${escapar(area.texto)}</p></li>`)
    .join("\n");
  const conteudo = `<section class="apresentacao">
  <img class="logo-grande" src="./assets/logo.png" alt="Logo de Fernanda Rogaciana: monograma R com balança da justiça" width="1050" height="600">
  <h1>${escapar(escritorio.nome)}</h1>
  <p class="oab">${escapar(escritorio.titulo)} · ${escapar(escritorio.oab)}</p>
  <p>Escritório de advocacia em ${escapar(escritorio.cidade)}. Este espaço reúne informações jurídicas em linguagem simples, para ajudar a entender direitos, prazos e mudanças nas leis e nas decisões dos tribunais.</p>
</section>
<section class="areas">
  <h2>Áreas de atuação</h2>
  <ul>${areas}</ul>
</section>
<section class="recentes">
  <h2>Publicações recentes</h2>
  ${listaPosts(posts.slice(0, 3), ".")}
  ${posts.length > 3 ? `<p><a href="./blog/">Ver todas as publicações</a></p>` : ""}
</section>`;
  return pagina({
    titulo: null,
    descricao: `${escritorio.nome}, ${escritorio.titulo.toLowerCase()} (${escritorio.oab}). Informações jurídicas em linguagem simples.`,
    conteudo,
  });
}

function paginaBlog(posts) {
  const conteudo = `<section class="blog">
  <h1>Blog</h1>
  <p>Publicações informativas sobre previdenciário, direito de família, recuperação de crédito e criminal, sempre com a fonte e a data.</p>
  ${listaPosts(posts, "..")}
</section>`;
  return pagina({ titulo: "Blog", descricao: "Publicações informativas, com fonte e data.", conteudo, profundidade: 1 });
}

// Arte do Instagram (1080 x 1080) na identidade visual do cartão.
function quebrarLinhas(texto, limite) {
  const linhas = [];
  let atual = "";
  for (const palavra of texto.split(" ")) {
    if ((atual + " " + palavra).trim().length > limite) {
      linhas.push(atual);
      atual = palavra;
    } else {
      atual = (atual + " " + palavra).trim();
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

export function arteInstagram(pub) {
  const linhas = quebrarLinhas(pub.instagram.textoImagem, 20);
  const alturaLinha = 92;
  const inicio = 560 - ((linhas.length - 1) * alturaLinha) / 2;
  const texto = linhas
    .map((linha, i) => `<text x="540" y="${inicio + i * alturaLinha}" text-anchor="middle">${escapar(linha)}</text>`)
    .join("");
  const logo = `<image x="400" y="95" width="280" height="217" href="data:image/png;base64,${monogramaBase64}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
  <rect width="1080" height="1080" fill="#6E1325"/>
  <rect x="40" y="40" width="1000" height="1000" rx="28" fill="none" stroke="#E3C2B0" stroke-width="6"/>
  <rect x="62" y="62" width="956" height="956" rx="18" fill="none" stroke="#E3C2B0" stroke-width="1.5" opacity="0.7"/>
  ${logo}
  <text x="540" y="350" text-anchor="middle" font-family="Lato, Arial, sans-serif" font-size="30" letter-spacing="6" fill="#E3C2B0">${escapar(pub.area.toUpperCase())}</text>
  <g font-family="'Cormorant Garamond', Georgia, serif" font-size="80" font-weight="600" fill="#FFF6F3">${texto}</g>
  <line x1="440" y1="800" x2="640" y2="800" stroke="#E3C2B0" stroke-width="2"/>
  <text x="540" y="870" text-anchor="middle" font-family="'Cormorant Garamond', Georgia, serif" font-size="44" fill="#E3C2B0">${escapar(escritorio.nome.toUpperCase())}</text>
  <text x="540" y="918" text-anchor="middle" font-family="Lato, Arial, sans-serif" font-size="26" letter-spacing="3" fill="#E3C2B0">${escapar(escritorio.titulo.toUpperCase())} · ${escapar(escritorio.oab)}</text>
  <text x="540" y="985" text-anchor="middle" font-family="Lato, Arial, sans-serif" font-size="20" fill="#E3C2B0" opacity="0.85">Conteúdo informativo. Fonte: ${escapar(pub.fontes[0].orgao.replace(/.*\((.*)\)/, "$1"))}, ${dataCurta(pub.fontes[0].data)}</text>
</svg>
`;
}

function previaAprovacao(pub, resultado) {
  const bloco = (titulo, texto, medida) =>
    `<section class="versao"><h2>${titulo}</h2>${medida ? `<p class="meta">${medida}</p>` : ""}<pre>${escapar(texto)}</pre></section>`;
  const conteudo = `<section class="previa">
  <p class="meta">Prévia para aprovação · status: <strong>${escapar(pub.status)}</strong></p>
  <h1>${escapar(pub.area)} · ${dataCurta(pub.dataPublicacao)}</h1>
  ${resultado.erros.length ? `<p class="erro">Erros: ${resultado.erros.map(escapar).join("; ")}</p>` : `<p>Formato e regras de publicidade conferidos automaticamente.</p>`}
  <p><a href="./blog.html">Ver como ficará a página do blog</a> · <a href="./instagram.svg">Arte do Instagram</a></p>
  ${bloco("a. Blog", `${pub.titulo}\n\n${pub.descricao}\n\n${pub.corpo}`, `${resultado.medidas.palavrasBlog} palavras · descrição com ${resultado.medidas.descricao} caracteres`)}
  ${bloco("b. Facebook", pub.facebook, `${resultado.medidas.facebook} caracteres, com o link reservado`)}
  ${bloco("c. Google Meu Negócio", pub.googleMeuNegocio, `${resultado.medidas.googleMeuNegocio} caracteres`)}
  ${bloco("d. Instagram", `${legendaInstagram(pub)}\n\nTexto da imagem: ${pub.instagram.textoImagem}`, `${resultado.medidas.instagram} caracteres · imagem com ${resultado.medidas.palavrasImagem} palavras`)}
  ${bloco("e. WhatsApp", pub.whatsapp, `${resultado.medidas.whatsapp} caracteres`)}
  <section class="versao"><h2>Lista de revisão</h2><ul>${pub.revisao.map((item) => `<li>${escapar(item)}</li>`).join("")}</ul></section>
</section>`;
  return pagina({ titulo: `Prévia · ${pub.titulo}`, descricao: pub.descricao, conteudo, profundidade: 1 });
}

// ---------------------------------------------------------------------------

let falhou = false;
const resultados = new Map();
for (const pub of publicacoes) {
  const resultado = validar(pub);
  resultados.set(pub.slug, resultado);
  if (resultado.erros.length) {
    falhou = true;
    console.error(`✗ ${pub.slug}:\n  - ${resultado.erros.join("\n  - ")}`);
  } else {
    console.log(`✓ ${pub.slug} ${JSON.stringify(resultado.medidas)}`);
  }
}

const noSite = publicacoes
  .filter((pub) => NO_SITE.has(pub.status))
  .sort((a, b) => b.dataPublicacao.localeCompare(a.dataPublicacao));

const saida = join(raiz, "site");
await rm(saida, { recursive: true, force: true });
const escrever = async (caminho, conteudo) => {
  await mkdir(dirname(caminho), { recursive: true });
  await writeFile(caminho, conteudo);
};

await escrever(join(saida, "index.html"), paginaInicial(noSite));
await escrever(join(saida, "blog", "index.html"), paginaBlog(noSite));
for (const pub of noSite) {
  await escrever(join(saida, "blog", pub.slug, "index.html"), paginaPost(pub));
}
for (const [de, para] of [["logo-original.png", "logo.png"], ["icone.png", "icone.png"]]) {
  await mkdir(join(saida, "assets"), { recursive: true });
  await copyFile(join(raiz, "src", "assets", de), join(saida, "assets", para));
}
await escrever(join(saida, "assets", "estilo.css"), await readFile(join(raiz, "src", "estilo.css"), "utf8"));

for (const pub of publicacoes.filter((p) => !NO_SITE.has(p.status))) {
  const pasta = join(raiz, "rascunhos", pub.slug);
  await escrever(join(pasta, "index.html"), previaAprovacao(pub, resultados.get(pub.slug)));
  await escrever(join(pasta, "blog.html"), paginaPost(pub, 1));
  await escrever(join(pasta, "instagram.svg"), arteInstagram(pub));
  // As prévias usam os mesmos recursos do site.
  await mkdir(join(raiz, "rascunhos", "assets"), { recursive: true });
  for (const [de, para] of [["logo-original.png", "logo.png"], ["icone.png", "icone.png"]]) {
    await copyFile(join(raiz, "src", "assets", de), join(raiz, "rascunhos", "assets", para));
  }
  await escrever(join(raiz, "rascunhos", "assets", "estilo.css"), await readFile(join(raiz, "src", "estilo.css"), "utf8"));
}

if (falhou) process.exit(1);
