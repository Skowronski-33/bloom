<?php
declare(strict_types=1);

require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_imagens.php';
bloomIniciar(['POST', 'OPTIONS']);

function pastaValida(string $pasta): string
{
    return in_array($pasta, ['produtos', 'banner'], true) ? $pasta : 'produtos';
}

try {
    $tamanhoMaximo = 6 * 1024 * 1024;
    if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > $tamanhoMaximo) {
        throw new InvalidArgumentException('Imagem muito grande.');
    }

    $dados = json_decode(file_get_contents('php://input'), true, 512, JSON_THROW_ON_ERROR);
    $imagem = is_array($dados) ? (string) ($dados['imagem'] ?? '') : '';
    $pasta = pastaValida(is_array($dados) ? (string) ($dados['pasta'] ?? 'produtos') : 'produtos');

    $url = bloomSalvarImagemBase64($imagem, $pasta);

    echo json_encode(['ok' => true, 'url' => $url]);
} catch (Throwable $erro) {
    $codigo = $erro instanceof InvalidArgumentException ? 422 : 500;
    http_response_code($codigo);
    error_log('[Bloom API] upload: ' . $erro->getMessage());
    $mensagem = $erro instanceof InvalidArgumentException ? $erro->getMessage() : 'Não foi possível processar a imagem.';
    echo json_encode(['erro' => $mensagem], JSON_UNESCAPED_UNICODE);
}
