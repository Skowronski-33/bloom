import os
from PIL import Image

def otimizar_imagem(caminho_entrada, caminho_saida=None, max_dim=1200, qualidade=85):
    """
    Reduz a dimensão e comprime a imagem mantendo alta qualidade visual.
    - max_dim: tamanho máximo em pixels (largura ou altura)
    - qualidade: qualidade de compressão JPEG/WebP (85 é o padrão ideal para web)
    """
    if caminho_saida is None:
        caminho_saida = caminho_entrada

    try:
        with Image.open(caminho_entrada) as img:
            # Converter para RGB caso seja RGBA e salvar como JPEG/WebP
            if img.mode in ("RGBA", "P") and caminho_saida.lower().endswith(('.jpg', '.jpeg')):
                img = img.convert("RGB")

            # Redimensionamento proporcional (Lanczos = máxima qualidade de reamostragem)
            img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

            # Salvar com otimização
            if caminho_saida.lower().endswith(('.jpg', '.jpeg')):
                img.save(caminho_saida, "JPEG", quality=qualidade, optimize=True)
            elif caminho_saida.lower().endswith('.webp'):
                img.save(caminho_saida, "WEBP", quality=qualidade, optimize=True)
            elif caminho_saida.lower().endswith('.png'):
                img.save(caminho_saida, "PNG", optimize=True)
            else:
                img.save(caminho_saida, quality=qualidade, optimize=True)

            tam_original = os.path.getsize(caminho_entrada) / 1024
            tam_novo = os.path.getsize(caminho_saida) / 1024
            economia = ((tam_original - tam_novo) / tam_original) * 100 if tam_original > 0 else 0
            print(f"✔ {os.path.basename(caminho_entrada)}: {tam_original:.1f}KB ➔ {tam_novo:.1f}KB (redução de {economia:.1f}%)")
    except Exception as e:
        print(f"✖ Erro ao processar {caminho_entrada}: {e}")

def otimizar_pasta(pasta, max_dim=1200, qualidade=85):
    extensoes = ('.jpg', '.jpeg', '.png', '.webp')
    print(f"Otimizando imagens na pasta: {pasta}...\n")
    for raiz, _, arquivos in os.walk(pasta):
        for arq in arquivos:
            if arq.lower().endswith(extensoes):
                caminho = os.path.join(raiz, arq)
                otimizar_imagem(caminho, max_dim=max_dim, qualidade=qualidade)

if __name__ == "__main__":
    pasta_atual = os.path.dirname(os.path.abspath(__file__))
    otimizar_pasta(pasta_atual)
