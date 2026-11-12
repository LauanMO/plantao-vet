#!/usr/bin/env python3
"""Gera a pixel art do protótipo 'Plantão Vet — versão jogo'.

Cenários em 320x180 e sprites pequenos. Por padrão salva no tamanho original (1x),
que é o que o palco do jogo usa; passe 4 para gerar a versão ampliada do protótipo.
Uso: python3 gerar.py <pasta_de_saida> [escala]
"""
import os
import sys

from PIL import Image, ImageDraw

ESCALA = 4

CORES = {
    'out': '#1B1A26',
    'wall': '#BFDCD3', 'wall_d': '#A6C8BE', 'wall_l': '#D4EAE3', 'base': '#7FA89C', 'base_d': '#5F8A7E',
    'floor': '#C9B79C', 'floor_d': '#B3A086', 'floor_l': '#DCCFB8',
    'wood': '#8A5A3B', 'wood_d': '#6B4429', 'wood_l': '#A8714C',
    'metal': '#C7CED4', 'metal_d': '#99A3AB', 'metal_l': '#E3E8EC',
    'night': '#22264A', 'night2': '#2E3566', 'star': '#F7F3EA', 'moon': '#F2E3A6', 'moon_d': '#D9C682',
    'frame': '#F7F3EA', 'paper': '#F4EEDC', 'line': '#5C6B73', 'clip': '#9AA4AD',
    'screen': '#5FD3B8', 'screen_d': '#2F8F7C', 'monitor': '#3A3F4B', 'monitor_d': '#2A2E38',
    'hall': '#3B3F5C', 'hall_floor': '#575C7A', 'light': '#E3D5BC',
    'b1': '#E07A5F', 'b2': '#81B29A', 'b3': '#F2CC8F', 'b4': '#3D5A80',
    'leaf': '#4E8F57', 'leaf_d': '#3B7044', 'pot': '#C0704D',
    'skin': '#C98E63', 'skin_d': '#A86F49', 'hair': '#3B2A20', 'shirt': '#E07A5F', 'shirt_d': '#C0603F',
    'pants': '#3D5A80', 'pants_d': '#2C4361', 'shoe': '#2A2433',
    'fur': '#D9A066', 'fur_d': '#B57E45', 'ear': '#8A5A2B', 'white': '#F2E6D8', 'nose': '#2A2433',
    'tongue': '#E58C8A', 'heart': '#E4572E', 'heart_l': '#F28C6A',
    'mug': '#E07A5F', 'key': '#D9DDE1',
    'sky1': '#1D1F3F', 'sky2': '#262A52', 'sky3': '#33386B', 'city': '#2A2D4F', 'city_win': '#C9A94E',
    'bwall': '#E9DCC9', 'bwall_d': '#D6C6AE', 'roof': '#4A4E69', 'sign': '#2E9C88', 'sign_d': '#227A6A',
    'glass': '#7FD1C1', 'glass_d': '#5DB5A4', 'lamp': '#F6D776', 'lamp_d': '#E0B94F', 'cross': '#3FA36B',
    'walk': '#8C8FA3', 'walk_d': '#777A8F', 'street': '#3A3D55', 'dash': '#C9C2A8', 'pole': '#4A4E69',
    'water': '#5DA9E9', 'water_l': '#A8D4F5', 'red': '#E4572E', 'blue': '#3D5A80',
}


def rgb(nome):
    h = CORES[nome].lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def rgba(nome):
    return rgb(nome) + (255,)


def ampliar(im, escala=ESCALA):
    if escala == 1:
        return im
    return im.resize((im.width * escala, im.height * escala), Image.NEAREST)


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


# ------------------------------------------------------------------ sprites

def nova_tela(w, h):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im)


def tutora():
    im, d = nova_tela(24, 64)

    def r(x0, y0, x1, y1, c):
        d.rectangle([x0, y0, x1, y1], fill=rgba(c))

    r(6, 1, 17, 18, 'hair')          # cabelo atrás
    r(8, 4, 15, 15, 'skin')          # rosto
    r(7, 2, 16, 5, 'hair')           # franja
    r(6, 4, 7, 16, 'hair')
    r(16, 4, 17, 16, 'hair')
    r(10, 9, 10, 9, 'out')           # olhos
    r(13, 9, 13, 9, 'out')
    r(11, 13, 12, 13, 'skin_d')      # boca
    r(10, 16, 13, 18, 'skin')        # pescoço
    r(6, 19, 17, 38, 'shirt')        # blusa
    r(6, 19, 7, 38, 'shirt_d')
    r(11, 19, 12, 21, 'skin')
    r(3, 20, 5, 35, 'shirt_d')       # braços
    r(18, 20, 20, 35, 'shirt')
    r(3, 36, 5, 38, 'skin')          # mãos
    r(18, 36, 20, 38, 'skin')
    r(6, 39, 17, 39, 'pants_d')      # cinto
    r(6, 40, 10, 58, 'pants')        # pernas
    r(13, 40, 17, 58, 'pants')
    r(11, 40, 12, 45, 'pants')
    r(9, 46, 10, 58, 'pants_d')
    r(5, 59, 10, 61, 'shoe')         # sapatos
    r(13, 59, 18, 61, 'shoe')
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


def main():
    saida = sys.argv[1]
    escala = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    os.makedirs(saida, exist_ok=True)
    arquivos = {
        'consultorio.png': consultorio(False),
        'consultorio-porta-aberta.png': consultorio(True),
        'fachada.png': fachada(),
        'tutora.png': tutora(),
        'pipoca-doente.png': pipoca(False),
        'pipoca-feliz.png': pipoca(True),
        'coracao.png': coracao(),
    }
    for nome in ('termometro', 'estetoscopio', 'lanterna', 'mao', 'gota'):
        arquivos['icone-' + nome + '.png'] = icone(nome)
    for nome, im in arquivos.items():
        final = ampliar(im, escala)
        final.save(os.path.join(saida, nome), optimize=True)
        print(nome, final.size, os.path.getsize(os.path.join(saida, nome)), 'bytes')

    # folha de conferência com tudo junto, sempre em 4x
    folha = Image.new('RGBA', (1280 * 2 + 40, 720 * 2 + 40), (40, 40, 48, 255))
    folha.paste(ampliar(consultorio(False), 4), (0, 0))
    folha.paste(ampliar(consultorio(True), 4), (1320, 0))
    folha.paste(ampliar(fachada(), 4), (0, 760))
    x = 1320
    for nome in ('tutora.png', 'pipoca-doente.png', 'pipoca-feliz.png', 'coracao.png',
                 'icone-termometro.png', 'icone-estetoscopio.png', 'icone-lanterna.png', 'icone-mao.png', 'icone-gota.png'):
        sp = ampliar(arquivos[nome], 4)
        folha.alpha_composite(sp, (x, 780))
        x += sp.width + 24
    folha.convert('RGB').save(os.path.join(saida, '_folha.png'))


if __name__ == '__main__':
    main()
