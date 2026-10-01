<?php
declare(strict_types=1);

require __DIR__ . '/_bootstrap.php';
['metodo' => $metodo, 'config' => $config] = bloomIniciar(['GET', 'POST', 'OPTIONS']);

function validarNumero(mixed $valor, float $minimo, float $maximo): bool
{
    if (!is_int($valor) && !is_float($valor) && !is_string($valor)) {
        return false;
    }
    if ($valor === '' || !is_numeric($valor)) {
        return false;
    }
    $numero = (float) $valor;
    return is_finite($numero) && $numero >= $minimo && $numero <= $maximo;
}

/**
 * Aceita vazio, um caminho gerado por upload.php/migrar-fotos.php (uploads/produtos|banner/hash.ext)
 * ou, por compatibilidade com catálogos ainda não otimizados, uma imagem embutida em base64.
 */
function validarReferenciaImagem(string $valor, int $limiteBytes): bool
{
    if ($valor === '') {
        return true;
    }
    if (preg_match('/^uploads\/(produtos|banner)\/[a-f0-9]{32}\.(jpe?g|png|webp)$/', $valor)) {
        return true;
    }
    return str_starts_with($valor, 'data:image/') && strlen($valor) <= $limiteBytes;
}

function validarCatalogo(array $dados): void
{
    if (array_key_exists('colecao', $dados)
        && (!is_string($dados['colecao']) || strlen($dados['colecao']) > 200)) {
        throw new InvalidArgumentException('Texto da coleção inválido.');
    }
    if (array_key_exists('banner', $dados)
        && (!is_string($dados['banner']) || !validarReferenciaImagem($dados['banner'], 5 * 1024 * 1024))) {
        throw new InvalidArgumentException('Banner inválido.');
    }

    if (array_key_exists('excluidos', $dados)) {
        if (!is_array($dados['excluidos']) || count($dados['excluidos']) > 5000) {
            throw new InvalidArgumentException('Lista de excluídos inválida.');
        }
        foreach ($dados['excluidos'] as $codigo) {
            if (!validarNumero($codigo, 1, 2147483647)) {
                throw new InvalidArgumentException('Código excluído inválido.');
            }
        }
    }

    $produtos = $dados['produtos'] ?? null;
    if (!is_array($produtos) || count($produtos) > 2000) {
        throw new InvalidArgumentException('Quantidade de produtos inválida.');
    }

    foreach ($produtos as $produto) {
        if (!is_array($produto)) {
            throw new InvalidArgumentException('Produto inválido.');
        }
        foreach (['c', 'n', 'v'] as $campo) {
            if (!array_key_exists($campo, $produto)) {
                throw new InvalidArgumentException('Produto sem campo obrigatório.');
            }
        }
        if (!validarNumero($produto['c'], 1, 2147483647)
            || (int) $produto['c'] != (float) $produto['c']
            || !is_string($produto['n']) || $produto['n'] === '' || strlen($produto['n']) > 240
            || !is_array($produto['v']) || count($produto['v']) < 1 || count($produto['v']) > 50) {
            throw new InvalidArgumentException('Dados básicos do produto inválidos.');
        }
        foreach (['cat' => 80, 'cor' => 120, 'bruto' => 240] as $campo => $limite) {
            if (array_key_exists($campo, $produto)
                && (!is_string($produto[$campo]) || strlen($produto[$campo]) > $limite)) {
                throw new InvalidArgumentException('Texto do produto inválido.');
            }
        }
        if (array_key_exists('foto', $produto)
            && (!is_string($produto['foto']) || !validarReferenciaImagem($produto['foto'], 5 * 1024 * 1024))) {
            throw new InvalidArgumentException('Imagem do produto inválida.');
        }
        foreach ($produto['v'] as $variante) {
            if (!is_array($variante)
                || !is_string($variante['t'] ?? null) || $variante['t'] === '' || strlen($variante['t']) > 20
                || !validarNumero($variante['q'] ?? null, 0, 1000000)
                || !validarNumero($variante['p'] ?? null, 0.01, 10000000)
                || !is_bool($variante['on'] ?? null)) {
                throw new InvalidArgumentException('Variante de produto inválida.');
            }
            foreach (['e' => 80, 'promocao' => 100] as $campo => $limite) {
                if (!array_key_exists($campo, $variante)) {
                    continue;
                }
                if ($campo === 'promocao') {
                    if (!validarNumero($variante[$campo], 0, 10000000)) {
                        throw new InvalidArgumentException('Promoção inválida.');
                    }
                } elseif (!is_string($variante[$campo]) || strlen($variante[$campo]) > $limite) {
                    throw new InvalidArgumentException('Código de variante inválido.');
                }
            }
        }
    }
}

try {
    $db = new mysqli($config['host'], $config['user'], $config['password'], $config['database'], $config['port'] ?? 3306);
    if ($db->connect_errno) {
        throw new RuntimeException('Falha ao conectar ao MySQL.');
    }
    $db->set_charset('utf8mb4');

    if ($metodo === 'GET') {
        $resultado = $db->query('SELECT dados FROM bloom_catalogo WHERE id = 1');
        $linha = $resultado->fetch_assoc();
        if (!$linha) {
            throw new RuntimeException('Catálogo ainda não foi importado.');
        }
        echo $linha['dados'];
        exit;
    }

    $tamanhoMaximo = 15 * 1024 * 1024;
    if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > $tamanhoMaximo) {
        throw new InvalidArgumentException('Catálogo muito grande.');
    }
    $dados = json_decode(file_get_contents('php://input'), true, 512, JSON_THROW_ON_ERROR);
    if (!is_array($dados) || !isset($dados['produtos']) || !is_array($dados['produtos'])) {
        throw new InvalidArgumentException('Formato de catálogo inválido.');
    }
    validarCatalogo($dados);

    $json = json_encode($dados, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    $stmt = $db->prepare('INSERT INTO bloom_catalogo (id, dados) VALUES (1, ?) ON DUPLICATE KEY UPDATE dados = VALUES(dados)');
    if (!$stmt) {
        throw new RuntimeException('Não foi possível preparar a gravação.');
    }
    $stmt->bind_param('s', $json);
    $stmt->execute();
    echo json_encode(['ok' => true, 'produtos' => count($dados['produtos'])]);
} catch (Throwable $erro) {
    http_response_code(500);
    error_log('[Bloom API] ' . $erro->getMessage());
    echo json_encode(['erro' => 'Não foi possível processar a solicitação.'], JSON_UNESCAPED_UNICODE);
}