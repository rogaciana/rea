// Confere as regras de formato e de publicidade (Provimento 205/2021 da OAB)
// de cada publicação antes do envio para aprovação.

export const AVISO = "Este conteúdo é apenas informativo e não substitui a análise de um caso concreto.";
export const MARCADOR_LINK = "{{LINK_BLOG}}";
// Tamanho reservado para o link do blog enquanto o site não tem endereço público.
const TAMANHO_LINK_RESERVADO = 90;

const EXPRESSOES_PROIBIDAS = [
  /entre em contato/i,
  /fale conosco/i,
  /procure (o|a|um|uma) (escrit|advog)/i,
  /contrate/i,
  /agende/i,
  /consulta gratuita/i,
  /honor[aá]rio/i,
  /R\$\s?\d/,
  /\bpre[cç]o/i,
  /resultado garantido/i,
  /garantimos/i,
  /o melhor escrit/i,
  /melhor advogad/i,
];

const caracteres = (texto) =>
  [...texto.replaceAll(MARCADOR_LINK, "x".repeat(TAMANHO_LINK_RESERVADO))].length;

const palavras = (texto) =>
  texto
    .replace(/^#+\s*/gm, "")
    .split(/\s+/)
    .filter((p) => /[\p{L}\p{N}]/u.test(p)).length;

export function legendaInstagram(pub) {
  return `${pub.instagram.legenda}\n\n${pub.instagram.hashtags.join(" ")}`;
}

export function validar(pub) {
  const erros = [];
  const medidas = {};
  const exigir = (condicao, mensagem) => {
    if (!condicao) erros.push(mensagem);
  };

  medidas.descricao = caracteres(pub.descricao);
  exigir(medidas.descricao <= 160, `descrição com ${medidas.descricao} caracteres (máximo 160)`);

  medidas.palavrasBlog = palavras(pub.corpo);
  exigir(
    medidas.palavrasBlog >= 300 && medidas.palavrasBlog <= 450,
    `blog com ${medidas.palavrasBlog} palavras (300 a 450)`,
  );
  exigir(/^#### /m.test(pub.corpo), "blog sem subtítulos ####");
  exigir(Array.isArray(pub.fontes) && pub.fontes.length > 0, "blog sem fonte");
  for (const fonte of pub.fontes ?? []) {
    exigir(/^\d{4}-\d{2}-\d{2}$/.test(fonte.data ?? ""), `fonte sem data: ${fonte.titulo}`);
  }

  medidas.facebook = caracteres(pub.facebook);
  exigir(medidas.facebook <= 600, `Facebook com ${medidas.facebook} caracteres (máximo 600)`);
  exigir(pub.facebook.trim().endsWith("?"), "Facebook não termina com pergunta");
  exigir(pub.facebook.includes(MARCADOR_LINK), "Facebook sem link do blog");

  medidas.googleMeuNegocio = caracteres(pub.googleMeuNegocio);
  exigir(pub.googleMeuNegocio === pub.facebook, "Google Meu Negócio diferente do Facebook");
  exigir(!/#\p{L}/u.test(pub.googleMeuNegocio), "Google Meu Negócio com hashtag");

  const legenda = legendaInstagram(pub);
  medidas.instagram = caracteres(legenda);
  exigir(medidas.instagram <= 1500, `Instagram com ${medidas.instagram} caracteres (máximo 1.500)`);
  exigir(pub.instagram.hashtags.length <= 5, "Instagram com mais de 5 hashtags");
  exigir(/link na bio/i.test(pub.instagram.legenda), "Instagram sem \"link na bio\"");
  exigir(!pub.instagram.legenda.includes("http"), "Instagram com link na legenda");
  medidas.palavrasImagem = palavras(pub.instagram.textoImagem);
  exigir(medidas.palavrasImagem <= 12, `texto da imagem com ${medidas.palavrasImagem} palavras (máximo 12)`);

  medidas.whatsapp = caracteres(pub.whatsapp);
  exigir(medidas.whatsapp <= 500, `WhatsApp com ${medidas.whatsapp} caracteres (máximo 500)`);
  exigir(pub.whatsapp.trim().endsWith(MARCADOR_LINK), "WhatsApp não termina com o link do blog");

  const hashtagsTikTok = pub.tiktok.hashtags ?? [];
  medidas.tiktok = caracteres(`${pub.tiktok.legenda}\n\n${hashtagsTikTok.join(" ")}`);
  exigir(medidas.tiktok <= 600, `TikTok com ${medidas.tiktok} caracteres (máximo 600)`);
  exigir(hashtagsTikTok.length <= 5, "TikTok com mais de 5 hashtags");
  exigir(/link na bio/i.test(pub.tiktok.legenda), "TikTok sem \"link na bio\"");
  exigir(!pub.tiktok.legenda.includes("http"), "TikTok com link na legenda");
  exigir(pub.tiktok.duracaoSegundos <= 60, "vídeo do TikTok com mais de 60 segundos");

  const versoes = {
    blog: pub.corpo,
    facebook: pub.facebook,
    googleMeuNegocio: pub.googleMeuNegocio,
    instagram: legenda,
    tiktok: `${pub.tiktok.legenda} ${pub.tiktok.roteiro.map((r) => r.texto).join(" ")}`,
    whatsapp: pub.whatsapp,
  };
  for (const [nome, texto] of Object.entries(versoes)) {
    exigir(texto.includes(AVISO), `${nome} sem a frase informativa`);
    for (const proibida of EXPRESSOES_PROIBIDAS) {
      exigir(!proibida.test(texto), `${nome} contém expressão vedada: ${proibida}`);
    }
  }

  return { erros, medidas };
}
