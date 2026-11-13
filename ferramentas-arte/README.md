# Ferramentas de arte

Scripts que geram toda a pixel art do Plantão Vet, sem compra e sem desenho à mão. Por enquanto há um só, `gerar.py`. Os efeitos sonoros não saem daqui: são sintetizados no jogo, em `src/som/`, com Web Audio.

## Como gerar

Precisa de Python 3 e da biblioteca Pillow. Rode da raiz do projeto:

```
pip install pillow
python ferramentas-arte/gerar.py
```

O script lê as cores de `conteudo/arte/paleta.json`, salva os PNGs em `public/arte/`, no tamanho original (1x), e reescreve o manifesto `conteudo/arte/sprites.json`. Rodar de novo sem mudar o script não muda nenhum arquivo. Ajustes de arte são feitos sempre no script, nunca editando os PNGs à mão, e um sprite só entra quando algum caso precisa dele.

## O que ele gera

| Arquivo | O que é | Tamanho (1x) |
| --- | --- | --- |
| `consultorio.png`, `consultorio-porta-aberta.png` | Consultório em primeira pessoa, com a porta fechada e aberta | 320×180 |
| `fachada.png` | Fachada da clínica à noite (tela de título) | 320×180 |
| `curral.png` | Curral à noite, com galpão e tronco de contenção | 320×180 |
| `tutora-1-parado.png` | Tutora em pé | 24×64 |
| `produtor-1-parado.png` | Produtor de chapéu de palha | 24×64 |
| `preceptora-parado.png` | Preceptora de jaleco | 24×64 |
| `cao-pequeno-caramelo-doente.png`, `-feliz.png` | Filhote caramelo abatido e recuperado | 38×26 |
| `vaca-holandesa-deitado.png`, `-feliz.png` | Vaca deitada de peito, com a cabeça no flanco, e em pé, recuperada | 114×67 |
| `coracao.png` | Coração da tela de retorno | 9×8 |
| `icone-*.png` | Ferramentas: termômetro, estetoscópio, lanterna, mão, gota | 18×18 |

## O manifesto

Os casos citam os personagens pelo id (`paciente.sprite` e `tutor.sprite`), e o manifesto diz, para cada id, o tamanho, o ponto do pé e os estados. Cada estado é um arquivo `<id>-<estado>.png`:

```json
"cao-pequeno-caramelo": { "largura": 38, "altura": 26, "pe": { "x": 16, "y": 23 }, "estados": ["doente", "feliz"] }
```

O ponto do pé é o pixel que encosta no chão, e a cena posiciona o personagem por ele. O script confere que o pé está na última linha do desenho em todos os estados. Cenários e ícones ficam fora do manifesto, porque o jogo os chama por nome fixo.

O `npm run validar` confere que cada sprite citado existe no manifesto, e que o paciente tem os estados que a cena usa: `doente` (ou `deitado`, quando a postura é deitado) e `feliz`. O tutor precisa de `parado`.

## Posições úteis (pixels de arte)

- Consultório: porta de x 48 a 88, com o chão da porta em y 117; tampo da mesa de exame de x 115 a 207, em y 102; a mesa do veterinário começa em y 146.
- Curral: o tronco de contenção vai de x 126 a 256; o chão começa em y 90, e os personagens da frente pisam por volta de y 140 a 146.
