# Ferramentas de arte

Scripts que geram toda a pixel art do Plantão Vet, sem compra e sem desenho à mão. Por enquanto há um só, `gerar.py`, que desenha a arte do protótipo: o consultório, a fachada, a tutora, a Pipoca, o coração do retorno e os ícones das ferramentas. Na Fase 2 ele cresce para o resto da arte e ganha a companhia do gerador de sons.

## Como gerar

Precisa de Python 3 e da biblioteca Pillow:

```
pip install pillow
python3 ferramentas-arte/gerar.py saida-arte        # tamanho original (1x), o que o palco do jogo usa
python3 ferramentas-arte/gerar.py saida-arte-4x 4   # ampliado 4x, como nas telas do protótipo
```

O script também salva `_folha.png`, com tudo junto em 4x, para conferir. Uma cópia do que ele gera hoje está em `docs/prototipo-pixel/img/`.

## O que ele gera

| Arquivo | O que é | Tamanho (1x) |
| --- | --- | --- |
| `consultorio.png` | Consultório em primeira pessoa, porta fechada | 320×180 |
| `consultorio-porta-aberta.png` | O mesmo, com a porta aberta | 320×180 |
| `fachada.png` | Fachada da clínica à noite (tela de título) | 320×180 |
| `tutora.png` | Tutora em pé | 24×64 |
| `pipoca-doente.png`, `pipoca-feliz.png` | Filhote caramelo abatido e recuperado | 38×26 |
| `coracao.png` | Coração da tela de retorno | 9×8 |
| `icone-*.png` | Ferramentas: termômetro, estetoscópio, lanterna, mão, gota | 18×18 |
| `_folha.png` | Tudo junto em 4x, para conferir | — |

## Posições úteis no consultório (pixels de arte)

- Porta: x 48 a 88, chão da porta em y 117
- Tampo da mesa de exame: x 115 a 207, y 102
- Mesa do veterinário começa em y 146

## O que muda na Fase 2

- As cores do topo do `gerar.py` (o dicionário `CORES`) vão para `conteudo/arte/paleta.json`, e o script passa a ler a paleta de lá.
- O script passa a salvar em `public/arte/` e a registrar cada sprite no manifesto `conteudo/arte/sprites.json`, com o tamanho do quadro, as animações e o ponto do pé.
- Entram o curral com o tronco de contenção, o produtor, a preceptora, a vaca nos três estados e deitada. Os sons de clique, porta, carimbo, acerto e erro não saem daqui: são sintetizados no jogo, em `src/som/`, com Web Audio.
- Ajustes de arte são feitos sempre no script, nunca editando os PNGs à mão.
