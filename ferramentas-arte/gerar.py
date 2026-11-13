#!/usr/bin/env python3
"""Gera toda a pixel art do Plantão Vet, no tamanho original (1x) que o palco usa.

Salva os PNGs em public/arte/ e escreve o manifesto conteudo/arte/sprites.json com os
personagens que os casos citam. As cores vêm de conteudo/arte/paleta.json.
Uso: python ferramentas-arte/gerar.py
"""
import json
import os

from PIL import Image, ImageDraw

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
with open(os.path.join(RAIZ, 'conteudo', 'arte', 'paleta.json'), encoding='utf-8') as f:
    CORES = json.load(f)


def rgb(nome):
    h = CORES[nome].lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def rgba(nome):
    return rgb(nome) + (255,)


def contorno(im, cor='out'):
    """Contorno de 1 px por fora dos pixels opacos (vizinhança de 4)."""
    w, h = im.size
    src = im.load()
    novo = im.copy()
    dst = novo.load()
    for y in range(h):
        for x in range(w):
            if src[x, y][3] != 0:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and src[nx, ny][3] > 0:
                    dst[x, y] = rgba(cor)
                    break
    return novo


# ---------------------------------------------------------------- cenários

def consultorio(porta_aberta):
    im = Image.new('RGB', (320, 180), rgb('wall'))
    d = ImageDraw.Draw(im)

    def r(x0, y0, x1, y1, c, contorno_cor=None):
        d.rectangle([x0, y0, x1, y1], fill=rgb(c), outline=rgb(contorno_cor) if contorno_cor else None)

    # parede: faixa inferior, rodameio e rodapé
    r(0, 84, 319, 113, 'wall_d')
    r(0, 83, 319, 84, 'base')
    r(0, 114, 319, 117, 'base_d')

    # piso com linhas em perspectiva
    r(0, 118, 319, 179, 'floor')
    for xb in range(-232, 560, 48):
        xt = 160 + (xb - 160) * 0.35
        d.line([(int(xt), 118), (xb, 179)], fill=rgb('floor_d'))
    for y in (124, 133, 146, 164):
        d.line([(0, y), (319, y)], fill=rgb('floor_d'))

    # placa acima da porta
    r(56, 16, 80, 21, 'frame', 'out')
    d.line([(60, 18), (76, 18)], fill=rgb('line'))

    # porta
    r(44, 24, 92, 117, 'wood_d')
    if porta_aberta:
        r(48, 28, 88, 117, 'hall')
        d.polygon([(48, 117), (88, 117), (80, 101), (56, 101)], fill=rgb('hall_floor'))
        r(60, 30, 76, 31, 'light')
        d.polygon([(44, 26), (34, 20), (34, 124), (44, 117)], fill=rgb('wood'), outline=rgb('wood_d'))
        d.polygon([(48, 118), (88, 118), (100, 138), (40, 138)], fill=rgb('floor_l'))
    else:
        r(48, 28, 88, 117, 'wood')
        d.rectangle([52, 62, 84, 64], fill=rgb('wood_l'))
        d.rectangle([52, 72, 84, 110], outline=rgb('wood_l'))
        r(60, 36, 76, 54, 'hall', 'wood_l')
        r(82, 80, 85, 82, 'metal_l')

    # estante com frascos e caixas
    r(4, 46, 36, 48, 'wood_l', 'out')
    r(4, 70, 36, 72, 'wood_l', 'out')
    r(6, 38, 10, 45, 'b1', 'out')
    r(13, 35, 17, 45, 'b2', 'out')
    r(20, 39, 24, 45, 'b3', 'out')
    r(27, 36, 31, 45, 'b4', 'out')
    r(6, 62, 14, 69, 'b3', 'out')
    r(17, 59, 21, 69, 'b1', 'out')
    r(24, 63, 34, 69, 'frame', 'out')
    d.line([(29, 64), (29, 68)], fill=rgb('red'))
    d.line([(27, 66), (31, 66)], fill=rgb('red'))

    # pôster de anatomia
    r(104, 26, 142, 68, 'paper', 'out')
    r(105, 27, 141, 31, 'b2')
    r(114, 44, 130, 50, 'line')
    r(130, 38, 137, 46, 'line')
    r(137, 42, 139, 45, 'line')
    for x in (115, 119, 125, 129):
        r(x, 51, x + 1, 60, 'line')
    d.line([(113, 45), (109, 40)], fill=rgb('line'), width=2)
    d.line([(110, 63), (136, 63)], fill=rgb('line'))

    # relógio
    d.ellipse([158, 22, 174, 38], fill=rgb('wall_l'), outline=rgb('out'))
    d.line([(166, 30), (166, 25)], fill=rgb('out'))
    d.line([(166, 30), (170, 30)], fill=rgb('out'))

    # janela com céu noturno
    r(214, 20, 298, 74, 'frame', 'out')
    r(217, 23, 295, 47, 'night')
    r(217, 48, 295, 71, 'night2')
    for (sx, sy) in ((222, 27), (231, 36), (244, 29), (262, 40), (268, 26), (226, 58), (247, 54), (289, 56), (262, 63)):
        im.putpixel((sx, sy), rgb('star'))
    d.ellipse([272, 28, 284, 40], fill=rgb('moon'))
    im.putpixel((276, 32), rgb('moon_d'))
    im.putpixel((279, 36), rgb('moon_d'))
    r(255, 23, 256, 71, 'frame')
    r(217, 47, 295, 48, 'frame')
    r(210, 74, 302, 77, 'frame', 'out')
    # planta no peitoril
    r(226, 52, 232, 64, 'leaf')
    r(220, 56, 228, 62, 'leaf')
    r(231, 55, 238, 61, 'leaf_d')
    r(224, 64, 234, 73, 'pot', 'out')

    # mesa de exame (inox)
    r(124, 112, 127, 130, 'metal_d')
    r(195, 112, 198, 130, 'metal_d')
    r(124, 124, 198, 125, 'metal_d')
    r(122, 130, 129, 132, 'out')
    r(193, 130, 200, 132, 'out')
    d.rectangle([115, 101, 207, 112], fill=rgb('metal'), outline=rgb('out'))
    r(116, 102, 206, 103, 'metal_l')
    r(116, 108, 206, 111, 'metal_d')

    # mesa do veterinário (primeiro plano)
    r(0, 146, 319, 151, 'wood_l')
    r(0, 152, 319, 153, 'wood_d')
    r(0, 154, 319, 179, 'wood')
    r(106, 154, 107, 179, 'wood_d')
    r(212, 154, 213, 179, 'wood_d')
    for x in (50, 155, 260):
        r(x, 164, x + 10, 165, 'metal_d')

    # computador
    r(264, 144, 272, 147, 'monitor_d')
    r(256, 147, 280, 149, 'monitor_d')
    d.rectangle([236, 104, 300, 144], fill=rgb('monitor'), outline=rgb('out'))
    r(240, 108, 296, 140, 'screen')
    for (x0, y, x1) in ((244, 113, 270), (244, 118, 290), (244, 123, 282), (244, 128, 286), (244, 133, 262)):
        d.line([(x0, y), (x1, y)], fill=rgb('screen_d'))
    d.rectangle([276, 111, 292, 120], outline=rgb('screen_d'))
    r(196, 147, 246, 150, 'key', 'line')
    for k in range(0, 15):
        im.putpixel((199 + k * 3, 148), rgb('line'))

    # prancheta (prontuário) em pé
    r(26, 110, 38, 116, 'clip', 'out')
    d.rectangle([16, 112, 48, 150], fill=rgb('wood_l'), outline=rgb('out'))
    r(19, 118, 45, 148, 'paper')
    r(26, 110, 38, 116, 'clip', 'out')
    for (x1, y) in ((42, 124), (40, 129), (42, 134), (36, 139), (40, 144)):
        d.line([(22, y), (x1, y)], fill=rgb('line'))

    # bloco de receita, caneta e caneca
    r(56, 142, 84, 147, 'paper', 'out')
    d.line([(60, 144), (80, 144)], fill=rgb('line'))
    r(86, 143, 96, 144, 'blue')
    r(100, 136, 108, 147, 'mug', 'out')
    r(109, 139, 111, 143, 'mug', 'out')
    for (sx, sy) in ((103, 132), (104, 130), (105, 133)):
        im.putpixel((sx, sy), rgb('frame'))
    return im


def fachada():
    im = Image.new('RGB', (320, 180), rgb('sky1'))
    d = ImageDraw.Draw(im)

    def r(x0, y0, x1, y1, c, contorno_cor=None):
        d.rectangle([x0, y0, x1, y1], fill=rgb(c), outline=rgb(contorno_cor) if contorno_cor else None)

    # céu em faixas, com transição pontilhada
    r(0, 60, 319, 99, 'sky2')
    r(0, 100, 319, 149, 'sky3')
    for x in range(0, 320, 2):
        im.putpixel((x, 59), rgb('sky2'))
        im.putpixel((x + 1 if x + 1 < 320 else x, 99), rgb('sky3'))
    for (sx, sy) in ((12, 8), (64, 14), (88, 6), (120, 20), (150, 9), (178, 16), (205, 7), (232, 22), (258, 12),
                     (286, 18), (306, 6), (96, 40), (140, 44), (190, 36), (240, 48), (300, 40), (70, 52), (20, 66)):
        im.putpixel((sx, sy), rgb('star'))
    d.ellipse([30, 18, 50, 38], fill=rgb('moon'))
    im.putpixel((36, 24), rgb('moon_d'))
    im.putpixel((43, 30), rgb('moon_d'))
    im.putpixel((38, 33), rgb('moon_d'))

    # prédios ao fundo
    r(0, 108, 30, 149, 'city')
    r(30, 96, 58, 149, 'city')
    r(262, 100, 290, 149, 'city')
    r(290, 112, 319, 149, 'city')
    for (wx, wy) in ((6, 116), (16, 124), (36, 104), (46, 112), (36, 128), (268, 108), (280, 120), (296, 120), (306, 132)):
        r(wx, wy, wx + 3, wy + 3, 'city_win')

    # clínica
    d.rectangle([69, 55, 251, 150], outline=rgb('out'))
    r(70, 64, 250, 150, 'bwall')
    r(70, 138, 250, 150, 'bwall_d')
    r(66, 56, 254, 64, 'roof', 'out')
    d.rectangle([95, 68, 225, 86], fill=rgb('sign'), outline=rgb('out'))
    d.rectangle([96, 69, 224, 85], outline=rgb('sign_d'))
    # cruz acima da porta
    r(150, 89, 170, 105, 'frame', 'out')
    r(158, 91, 162, 103, 'cross')
    r(152, 95, 168, 99, 'cross')
    # porta de vidro
    d.rectangle([145, 108, 175, 150], fill=rgb('glass'), outline=rgb('out'))
    r(160, 109, 160, 149, 'glass_d')
    r(156, 127, 157, 132, 'out')
    r(163, 127, 164, 132, 'out')
    # janelas acesas
    for (x0, x1) in ((84, 134), (186, 236)):
        d.rectangle([x0, 96, x1, 130], fill=rgb('lamp'), outline=rgb('out'))
        r((x0 + x1) // 2, 97, (x0 + x1) // 2, 129, 'lamp_d')
        r(x0 + 1, 113, x1 - 1, 113, 'lamp_d')
    # arbustos
    for (x0, x1) in ((72, 98), (118, 142), (178, 200), (222, 248)):
        d.ellipse([x0, 140, x1, 156], fill=rgb('leaf'), outline=rgb('out'))
        d.ellipse([x0 + 4, 148, x1 - 4, 156], fill=rgb('leaf_d'))
    # calçada e rua
    r(0, 151, 319, 160, 'walk')
    r(0, 160, 319, 161, 'walk_d')
    r(0, 162, 319, 179, 'street')
    for x in range(4, 320, 24):
        r(x, 170, x + 11, 171, 'dash')
    # poste
    r(276, 98, 278, 158, 'pole')
    r(268, 97, 278, 98, 'pole')
    d.rectangle([265, 99, 272, 103], fill=rgb('lamp'), outline=rgb('out'))
    return im


def curral():
    """Curral à noite, com o galpão à esquerda e o tronco de contenção no centro."""
    im = Image.new('RGB', (320, 180), rgb('sky1'))
    d = ImageDraw.Draw(im)

    def r(x0, y0, x1, y1, c, contorno_cor=None):
        d.rectangle([x0, y0, x1, y1], fill=rgb(c), outline=rgb(contorno_cor) if contorno_cor else None)

    # céu e morros
    r(0, 44, 319, 89, 'sky2')
    for x in range(0, 320, 2):
        im.putpixel((x, 43), rgb('sky2'))
    for (sx, sy) in ((14, 10), (52, 22), (90, 8), (128, 18), (166, 6), (204, 24), (236, 10), (300, 20), (112, 36),
                     (186, 40), (250, 34), (70, 38)):
        im.putpixel((sx, sy), rgb('star'))
    d.ellipse([268, 12, 286, 30], fill=rgb('moon'))
    im.putpixel((273, 18), rgb('moon_d'))
    im.putpixel((280, 24), rgb('moon_d'))
    for (x0, x1, topo) in ((-60, 130, 58), (90, 250, 66), (210, 390, 54)):
        d.ellipse([x0, topo, x1, topo + 70], fill=rgb('city'))

    # chão de terra, com a luz do lampião
    r(0, 90, 319, 179, 'terra')
    d.ellipse([-10, 112, 120, 160], fill=rgb('terra_l'))
    for (x0, y0, x1) in ((96, 124, 120), (210, 132, 240), (266, 118, 292), (30, 166, 60), (150, 170, 182),
                         (250, 160, 274)):
        r(x0, y0, x1, y0 + 1, 'terra_d')
    for (sx, sy) in ((40, 140), (44, 141), (58, 136), (110, 150), (190, 158), (214, 146), (286, 140), (300, 164)):
        r(sx, sy, sx + 2, sy, 'feno')

    # cerca do fundo
    for y in (70, 82):
        r(60, y, 319, y + 2, 'wood_l')
        r(60, y + 3, 319, y + 3, 'wood_d')
    for x in range(66, 320, 38):
        r(x, 64, x + 3, 94, 'wood', 'out')

    # galpão com feno
    d.polygon([(-6, 54), (30, 34), (70, 54)], fill=rgb('roof'), outline=rgb('out'))
    r(0, 54, 62, 118, 'wood', 'out')
    for x in range(6, 62, 7):
        r(x, 55, x, 117, 'wood_d')
    r(12, 74, 40, 118, 'hall', 'out')
    for (x0, y0) in ((14, 104), (26, 104), (18, 92)):
        r(x0, y0, x0 + 11, y0 + 11, 'feno', 'out')
        r(x0 + 1, y0 + 5, x0 + 10, y0 + 5, 'feno_d')
    # lampião pendurado no canto do galpão
    r(62, 60, 70, 60, 'pole')
    r(68, 61, 68, 63, 'pole')
    d.rectangle([66, 64, 70, 70], fill=rgb('lamp'), outline=rgb('out'))
    r(68, 66, 68, 68, 'lamp_d')

    # tronco de contenção: tábuas grossas entre os moirões e a pescoceira de metal na frente
    for y in range(60, 116, 9):
        r(126, y, 234, y + 4, 'wood_l', 'out')
    for x in (126, 164, 202):
        r(x, 52, x + 5, 124, 'wood', 'out')
    r(122, 49, 238, 52, 'wood_d', 'out')
    r(234, 52, 240, 124, 'metal_d', 'out')
    for x in (242, 247, 252):
        r(x, 58, x + 1, 120, 'metal', 'out')
    r(234, 56, 256, 58, 'metal_d', 'out')
    r(122, 122, 244, 125, 'terra_d')

    # capim no primeiro plano
    for x in range(2, 320, 11):
        h = 4 + (x * 7) % 5
        d.polygon([(x, 179), (x + 3, 179 - h), (x + 6, 179)], fill=rgb('leaf_d'))
        d.line([(x + 3, 179), (x + 3, 179 - h)], fill=rgb('leaf'))
    return im


# ------------------------------------------------------------------ sprites

def nova_tela(w, h):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im)


def atras(im, x0, y0, x1, y1, cor):
    """Pinta só onde ainda está transparente, como se ficasse atrás do que já foi desenhado."""
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if im.getpixel((x, y))[3] == 0:
                im.putpixel((x, y), rgba(cor))


def pessoa(pele, pele_d, blusa, blusa_d, calca, calca_d, sapato):
    """Corpo de 24x64, em pé e de frente; cada personagem desenha o cabelo e a roupa por cima."""
    im, d = nova_tela(24, 64)

    def r(x0, y0, x1, y1, c):
        d.rectangle([x0, y0, x1, y1], fill=rgba(c))

    r(8, 4, 15, 15, pele)            # rosto
    r(10, 9, 10, 9, 'out')           # olhos
    r(13, 9, 13, 9, 'out')
    r(11, 13, 12, 13, pele_d)        # boca
    r(10, 16, 13, 18, pele)          # pescoço
    r(6, 19, 17, 38, blusa)          # blusa
    r(6, 19, 7, 38, blusa_d)
    r(11, 19, 12, 21, pele)
    r(3, 20, 5, 35, blusa_d)         # braços
    r(18, 20, 20, 35, blusa)
    r(3, 36, 5, 38, pele)            # mãos
    r(18, 36, 20, 38, pele)
    r(6, 39, 17, 39, calca_d)        # cinto
    r(6, 40, 10, 58, calca)          # pernas
    r(13, 40, 17, 58, calca)
    r(11, 40, 12, 45, calca)
    r(9, 46, 10, 58, calca_d)
    r(5, 59, 10, 61, sapato)         # sapatos
    r(13, 59, 18, 61, sapato)
    return im, r


def tutora():
    im, r = pessoa('skin', 'skin_d', 'shirt', 'shirt_d', 'pants', 'pants_d', 'shoe')
    atras(im, 6, 1, 17, 18, 'hair')  # cabelo comprido
    r(7, 2, 16, 5, 'hair')           # franja
    r(6, 4, 7, 16, 'hair')
    r(16, 4, 17, 16, 'hair')
    return contorno(im)


def produtor():
    im, r = pessoa('skin2', 'skin2_d', 'plaid', 'plaid_d', 'khaki', 'khaki_d', 'wood_d')
    for y in (24, 29, 34):           # camisa xadrez
        r(8, y, 17, y, 'plaid_d')
    for x in (10, 14):
        r(x, 22, x, 38, 'plaid_d')
    r(10, 12, 13, 12, 'gray')        # bigode
    r(7, 6, 7, 10, 'gray')           # costeletas
    r(16, 6, 16, 10, 'gray')
    r(8, 1, 15, 3, 'straw')          # chapéu de palha
    r(8, 3, 15, 3, 'straw_d')
    r(4, 4, 19, 5, 'straw')
    r(4, 5, 19, 5, 'straw_d')
    r(5, 54, 10, 58, 'wood_d')       # canos das botas
    r(13, 54, 18, 58, 'wood_d')
    return contorno(im)


def preceptora():
    im, r = pessoa('skin3', 'skin3_d', 'screen', 'screen_d', 'screen', 'screen_d', 'shoe')
    r(6, 19, 17, 46, 'metal_l')      # jaleco
    r(6, 19, 7, 46, 'metal')
    r(10, 19, 13, 24, 'screen')      # pijama cirúrgico no decote
    r(11, 25, 12, 26, 'screen')
    r(11, 19, 12, 20, 'skin3')
    r(3, 20, 5, 35, 'metal')         # mangas
    r(18, 20, 20, 35, 'metal_l')
    r(13, 36, 16, 38, 'metal')       # bolso
    r(9, 19, 9, 26, 'line')          # estetoscópio no pescoço
    r(14, 19, 14, 26, 'line')
    r(14, 27, 15, 28, 'metal_d')
    atras(im, 7, 2, 16, 12, 'hair_r')  # cabelo preso
    r(7, 3, 16, 5, 'hair_r')
    r(10, 1, 13, 2, 'hair_r')        # coque
    return contorno(im)


def pipoca(feliz):
    im, d = nova_tela(38, 26)

    def r(x0, y0, x1, y1, c):
        d.rectangle([x0, y0, x1, y1], fill=rgba(c))

    if feliz:
        d.line([(8, 11), (5, 6), (7, 2)], fill=rgba('fur'), width=2)
    else:
        d.line([(8, 12), (5, 19)], fill=rgba('fur_d'), width=2)
    r(7, 10, 25, 17, 'fur')                  # corpo
    r(14, 11, 18, 13, 'ear')                 # mancha
    r(11, 16, 22, 17, 'white')               # barriga
    for (x, c) in ((8, 'fur_d'), (12, 'fur'), (20, 'fur_d'), (23, 'fur')):
        r(x, 18, x + 2, 22, c)               # patas
        r(x, 22, x + 2, 22, 'white')
    r(23, 7, 27, 12, 'fur')                  # pescoço
    r(24, 3, 33, 11, 'fur')                  # cabeça
    r(31, 7, 35, 11, 'white')                # focinho
    r(35, 7, 36, 8, 'nose')
    r(32, 11, 35, 11, 'fur_d')
    if feliz:
        r(25, 0, 27, 4, 'ear')               # orelha erguida
        r(30, 5, 30, 6, 'out')               # olho aberto
        r(33, 12, 34, 13, 'tongue')
    else:
        r(24, 4, 26, 11, 'ear')              # orelha caída
        r(29, 6, 30, 6, 'out')               # olho meio fechado
    return contorno(im)


def vaca(deitada):
    """Vaca holandesa de perfil, virada para a direita: em pé, recuperada, ou deitada de peito
    com a cabeça virada para o flanco. As duas posturas apoiam no chão na mesma linha."""
    K = 1.3  # o traço é pensado em 88x51 e ampliado aqui, para a vaca ter o tamanho certo perto das pessoas
    im, d = nova_tela(114, 67)

    def esc(*v):
        return [round(n * K) for n in v]

    def r(x0, y0, x1, y1, c):
        d.rectangle(esc(x0, y0, x1, y1), fill=rgba(c))

    def o(x0, y0, x1, y1, c):
        d.ellipse(esc(x0, y0, x1, y1), fill=rgba(c))

    def q(x0, y0, x1, y1, raio, c, borda=None):
        d.rounded_rectangle(esc(x0, y0, x1, y1), radius=round(raio * K), fill=rgba(c), outline=borda and rgba(borda))

    def poli(pontos, c, borda=None):
        d.polygon([tuple(esc(x, y)) for x, y in pontos], fill=rgba(c), outline=borda and rgba(borda))

    def traco(pontos, c):
        d.line([tuple(esc(x, y)) for x, y in pontos], fill=rgba(c), width=2)

    if deitada:
        traco([(14, 34), (8, 42), (8, 46)], 'white_d')                  # rabo no chão
        o(4, 44, 10, 49, 'nose')
        q(12, 28, 66, 49, 8, 'white')                                   # corpo
        o(12, 31, 24, 45, 'nose')                                       # malhas, longe da cabeça
        o(26, 37, 40, 48, 'nose')
        o(48, 38, 58, 47, 'nose')
        r(18, 46, 60, 49, 'white_d')                                    # barriga no chão
        r(28, 45, 34, 49, 'white_d')                                    # perna de trás dobrada
        r(32, 46, 36, 49, 'shoe')
        o(60, 41, 72, 49, 'white')                                      # joelho da frente
        r(61, 47, 71, 49, 'white_d')
        poli([(58, 30), (64, 22), (70, 30), (68, 42), (60, 44)], 'white')               # pescoço dobrado
        poli([(64, 17), (57, 17), (44, 25), (42, 33), (50, 35), (65, 27)], 'nose', 'out')  # cabeça no flanco
        traco([(59, 19), (47, 27)], 'white')                            # lista branca da cara
        q(37, 27, 45, 35, 2, 'pink', 'out')                             # focinho
        r(39, 29, 39, 30, 'pink_d')
        r(55, 23, 57, 23, 'white_d')                                    # olho fechado
        r(62, 24, 64, 29, 'nose')                                       # orelha caída
        return contorno(im)

    traco([(13, 14), (10, 22), (10, 38)], 'white_d')                    # rabo
    o(8, 37, 12, 44, 'nose')
    r(22, 34, 25, 46, 'white_d')                                        # pernas do outro lado
    r(58, 34, 61, 46, 'white_d')
    r(22, 47, 25, 49, 'shoe')
    r(58, 47, 61, 49, 'shoe')
    q(12, 12, 64, 37, 5, 'white')                                       # corpo
    r(13, 10, 20, 12, 'white')                                          # garupa
    o(12, 14, 20, 26, 'nose')                                           # malhas
    o(24, 12, 40, 28, 'nose')
    o(44, 20, 56, 34, 'nose')
    r(16, 35, 60, 37, 'white_d')                                        # barriga
    o(26, 32, 36, 41, 'pink')                                           # úbere
    r(28, 41, 28, 43, 'pink_d')
    r(33, 41, 33, 43, 'pink_d')
    r(15, 36, 19, 46, 'white')                                          # pernas deste lado
    r(51, 36, 55, 46, 'white')
    r(15, 47, 19, 49, 'shoe')
    r(51, 47, 55, 49, 'shoe')
    poli([(58, 14), (68, 9), (73, 22), (62, 33)], 'white')              # pescoço
    poli([(65, 6), (72, 5), (82, 17), (82, 24), (74, 25), (66, 16)], 'nose')  # cabeça
    traco([(72, 6), (80, 17)], 'white')                                 # lista branca da cara
    q(76, 17, 83, 25, 2, 'pink')                                        # focinho
    r(81, 19, 81, 20, 'pink_d')
    r(77, 23, 82, 23, 'pink_d')
    r(69, 10, 70, 10, 'white')                                          # olho aberto
    r(70, 10, 70, 10, 'out')
    r(60, 7, 65, 9, 'nose')                                             # orelha erguida
    r(61, 8, 63, 8, 'pink')
    return contorno(im)


def coracao():
    im, d = nova_tela(9, 8)
    desenho = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...']
    for y, linha in enumerate(desenho):
        for x, ch in enumerate(linha):
            if ch == '#':
                im.putpixel((x + 1, y + 1), rgba('heart'))
    im.putpixel((2, 2), rgba('heart_l'))
    return contorno(im)


def icone(nome):
    im, d = nova_tela(18, 18)

    def r(x0, y0, x1, y1, c):
        d.rectangle([x0, y0, x1, y1], fill=rgba(c))

    if nome == 'termometro':
        d.line([(4, 14), (13, 5)], fill=rgba('frame'), width=3)
        d.line([(6, 12), (10, 8)], fill=rgba('red'), width=1)
        d.ellipse([2, 12, 6, 16], fill=rgba('red'))
    elif nome == 'estetoscopio':
        r(3, 2, 4, 3, 'metal_l')
        r(13, 2, 14, 3, 'metal_l')
        d.line([(4, 4), (5, 8), (8, 10)], fill=rgba('line'), width=2)
        d.line([(13, 4), (12, 8), (9, 10)], fill=rgba('line'), width=2)
        r(8, 10, 9, 12, 'line')
        d.ellipse([5, 12, 12, 17], fill=rgba('metal'))
        r(8, 14, 9, 15, 'metal_d')
    elif nome == 'lanterna':
        r(2, 7, 10, 11, 'blue')
        r(6, 6, 7, 6, 'red')
        r(11, 6, 13, 12, 'metal')
        r(14, 7, 14, 11, 'lamp')
        d.polygon([(15, 7), (17, 4), (17, 14), (15, 11)], fill=rgba('lamp'))
    elif nome == 'mao':
        r(3, 3, 4, 8, 'skin')
        r(6, 2, 7, 8, 'skin')
        r(9, 2, 10, 8, 'skin')
        r(12, 3, 13, 8, 'skin')
        r(3, 8, 13, 14, 'skin')
        r(1, 9, 2, 12, 'skin')
        r(5, 15, 11, 16, 'skin_d')
    elif nome == 'gota':
        d.polygon([(9, 1), (4, 9), (14, 9)], fill=rgba('water'))
        d.ellipse([4, 6, 14, 16], fill=rgba('water'))
        r(6, 9, 7, 12, 'water_l')
    return contorno(im)


# Personagens que os casos citam pelo id. O ponto do pé é o pixel que encosta no chão:
# é por ele que a cena posiciona o personagem, igual em todos os estados.
PERSONAGENS = {
    'tutora-1': ((12, 62), {'parado': tutora()}),
    'produtor-1': ((12, 62), {'parado': produtor()}),
    'preceptora': ((12, 62), {'parado': preceptora()}),
    'cao-pequeno-caramelo': ((16, 23), {'doente': pipoca(False), 'feliz': pipoca(True)}),
    'vaca-holandesa': ((49, 65), {'deitado': vaca(True), 'feliz': vaca(False)}),
}


def main():
    saida = os.path.join(RAIZ, 'public', 'arte')
    arquivos = {
        'consultorio.png': consultorio(False),
        'consultorio-porta-aberta.png': consultorio(True),
        'fachada.png': fachada(),
        'curral.png': curral(),
        'coracao.png': coracao(),
    }
    for nome in ('termometro', 'estetoscopio', 'lanterna', 'mao', 'gota'):
        arquivos['icone-' + nome + '.png'] = icone(nome)

    manifesto = {}
    for id_, ((pe_x, pe_y), estados) in PERSONAGENS.items():
        largura, altura = next(iter(estados.values())).size
        for estado, im in estados.items():
            assert im.size == (largura, altura), f'{id_}-{estado}: tamanho diferente dos outros estados'
            assert im.getbbox()[3] - 1 == pe_y, f'{id_}-{estado}: o pé não está na última linha do desenho'
            arquivos[f'{id_}-{estado}.png'] = im
        manifesto[id_] = {'largura': largura, 'altura': altura, 'pe': {'x': pe_x, 'y': pe_y}, 'estados': list(estados)}

    for nome, im in arquivos.items():
        im.save(os.path.join(saida, nome), optimize=True)
        print(nome, im.size)
    with open(os.path.join(RAIZ, 'conteudo', 'arte', 'sprites.json'), 'w', encoding='utf-8', newline='\n') as f:
        json.dump(manifesto, f, ensure_ascii=False, indent=2)
        f.write('\n')


if __name__ == '__main__':
    main()
