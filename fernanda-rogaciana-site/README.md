# Site e publicações · Fernanda Rogaciana Advocacia

Site estático (institucional + blog) e banco de publicações informativas do escritório
Fernanda Rogaciana, advogada, OAB/SP 496.545.

## Estrutura

- `content/escritorio.json`: nome, OAB, endereço e contatos (conforme o timbrado), links dos canais e áreas.
- `content/publicacoes.json`: banco de publicações. Cada item traz as cinco versões (blog, Facebook,
  Google Meu Negócio, Instagram, WhatsApp), fontes com data, lista de revisão e `status`
  (`pendente`, `aprovada` ou `publicada`). Só `aprovada` e `publicada` aparecem no site.
- `src/validar.mjs`: confere tamanhos, frase informativa e expressões vedadas pelo Provimento 205/2021.
- `src/build.mjs`: gera `site/` (para hospedar) e `rascunhos/<slug>/` (prévia para aprovação e arte do Instagram).

## Uso

```sh
node src/build.mjs
```

O comando falha se alguma publicação quebrar as regras de formato ou de publicidade.

## Fluxo

1. A execução agendada (segunda, quarta e sexta) acrescenta uma publicação com `status: "pendente"`
   e registra a seção no documento de projeto.
2. A advogada revisa. Só após a aprovação explícita o status muda para `aprovada`, o site é gerado e
   o link do blog substitui `{{LINK_BLOG}}` nas demais versões.
3. Depois de publicar cada canal, o link vai para `publicacoes` e o status passa a `publicada`.

Nenhuma senha, token ou dado de acesso fica neste repositório.

## Pendências

- Endereço público do site (`siteUrl`) e hospedagem.
- Links de Facebook, Instagram e Google Meu Negócio em `content/escritorio.json`.
