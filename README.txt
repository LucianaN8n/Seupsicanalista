# Mentor Clínico V4a — Deploy no Netlify

## Passo a passo (Drag & Drop)
1) Extraia o .zip localmente (não suba o .zip direto).
2) No Netlify, vá em **Sites > Add new site > Deploy manually**.
3) Arraste a **pasta** com estes arquivos (precisa conter `index.html` na raiz).
4) Garanta que o **Publish directory** é a própria pasta (raiz).

## Rotas & 404
- O arquivo `_redirects` já garante que qualquer rota (ex.: `/app` ou `/qualquer-coisa`) volte para `index.html` com **HTTP 200**.
- `404.html` exibe um fallback amigável caso o `_redirects` não seja respeitado.

## Versões
- **index.html** → versão padrão (site).
- **index_iframe.html** → versão Hotmart (para embutir em iframe).
- Para usar no Hotmart, renomeie `_headers_iframe` para `_headers` antes do deploy.

## CSP/CDN
- `_headers` já libera `https://cdn.jsdelivr.net` (html2canvas/jsPDF) para o PDF funcionar.
