# Design — Produto X

## Identidade visual
A interface usa exclusivamente preto, branco, cinzas neutros e o azul
`#2563EB`. O logo oficial fica em `public/logo.png` e usa `mix-blend-mode:
screen` sobre fundos escuros para eliminar visualmente o retângulo preto do
arquivo original.

## Tokens
- Fundo principal: `#000000`
- Superfícies e cards: `#0A0A0A`
- Bordas: `#1F1F1F`
- Texto principal: `#FFFFFF`
- Texto secundário: `#A3A3A3`
- Acento único: `#2563EB` e opacidades do mesmo azul

Não usar verde, amarelo, vermelho, roxo ou outras cores. Estados usam ícones,
animação e intensidade do azul: ocioso cinza, processamento azul pulsando,
concluído branco com check e erro com alerta branco.

## Layout e responsividade
A barra lateral fixa tem aproximadamente 240px no desktop, com logo, nome,
navegação, configurações e pergunta no rodapé. No celular ela desliza por trás
do botão hambúrguer; a pergunta fica fixa na parte inferior. O estado vazio usa
logo de aproximadamente 160px com brilho radial azul suave. Cards têm fundo
`#0A0A0A`, borda `#1F1F1F` e cantos arredondados.

## Tipografia e espaçamento
Inter é usada em até três pesos, com títulos em line-height de 120% e texto em
150%. O espaçamento segue múltiplos de 8px. A interface é mobile-first.
