<?php
declare(strict_types=1);

require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_imagens.php';
$contexto = bloomIniciar(['POST', 'OPTIONS']);
$config = $contexto['config'];

/**
 * Se o valor for uma imagem embutida em base64, salva como arquivo em /uploads
 * e devolve o caminho relativo. Caso contrário (já é um caminho, está vazio, ou
 * a imagem é inválida demais para salvar), devolve o valor original sem
 * alteração — por isso é seguro rodar mais de uma vez.
 */
function migrarCampoImagem(string $valor, string $pasta): string
{
    if (!str_starts_with($valor, 'data:image/')) {
        return $valor;
    }
    try {
        return bloomSalvarImagemBase64($valor, $pasta);
    } catch (Throwable $erro) {
        return $valor;
    }
}

try {
    $db = new mysqli($config['host'], $config['user'], $config['password'], $config['database'], $config['port'] ?? 3306);
    if ($db->connect_errno) {
        throw new RuntimeException('Falha ao conectar ao MySQL.');
    }
    $db->set_charset('utf8mb4');

    $resultado = $db->query('SELECT dados FROM bloom_catalogo WHERE id = 1');
    $linha = $resultado->fetch_assoc();
    if (!$linha) {
        throw new RuntimeException('Catálogo ainda não foi importado.');
    }

    $tamanhoAntes = strlen($linha['dados']);
    $dados = json_decode($linha['dados'], true, 512, JSON_THROW_ON_ERROR);
    if (!is_array($dados)) {
        throw new RuntimeException('Catálogo salvo em formato inesperado.');
    }

    $migradas = 0;

    if (isset($dados['banner']) && is_string($dados['banner']) && $dados['banner'] !== '') {
        $novo = migrarCampoImagem($dados['banner'], 'banner');
        if ($novo !== $dados['banner']) {
            $dados['banner'] = $novo;
            $migradas++;
        }
    }

    if (isset($dados['produtos']) && is_array($dados['produtos'])) {
        foreach ($dados['produtos'] as &$produto) {
            if (is_array($produto) && isset($produto['foto']) && is_string($produto['foto']) && $produto['foto'] !== '') {
                $novo = migrarCampoImagem($produto['foto'], 'produtos');
                if ($novo !== $produto['foto']) {
                    $produto['foto'] = $novo;
                    $migradas++;
                }
            }
        }
        unset($produto);
    }

    $tamanhoDepois = $tamanhoAntes;
    if ($migradas > 0) {
        $json = json_encode($dados, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        $tamanhoDepois = strlen($json);
        $stmt = $db->prepare('UPDATE bloom_catalogo SET dados = ? WHERE id = 1');
        if (!$stmt) {
            throw new RuntimeException('Não foi possível preparar a gravação.');
        }
        $stmt->bind_param('s', $json);
        $stmt->execute();
    }

    echo json_encode([
        'ok' => true,
        'fotos_migradas' => $migradas,
        'tamanho_antes' => $tamanhoAntes,
        'tamanho_depois' => $tamanhoDepois,
        'colecao' => $dados['colecao'] ?? null,
        'banner' => $dados['banner'] ?? null,
        'produtos' => $dados['produtos'] ?? [],
    ]);
} catch (Throwable $erro) {
    http_response_code(500);
    error_log('[Bloom API] migrar-fotos: ' . $erro->getMessage());
    echo json_encode(['erro' => 'Não foi possível processar a solicitação.'], JSON_UNESCAPED_UNICODE);
}
