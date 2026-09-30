<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
$origemPermitida = 'https://bloombabyekids.com.br';
$origem = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
if ($origem === $origemPermitida) {
    header('Access-Control-Allow-Origin: ' . $origemPermitida);
    header('Vary: Origin');
}
header('Access-Control-Allow-Headers: Content-Type, X-Bloom-Token');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');
if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
    header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
}

$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (!in_array($metodo, ['POST', 'OPTIONS'], true)) {
    http_response_code(405);
    header('Allow: POST, OPTIONS');
    echo json_encode(['erro' => 'Método não permitido.']);
    exit;
}

if ($metodo === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($origem !== '' && $origem !== $origemPermitida) {
    http_response_code(403);
    echo json_encode(['erro' => 'Origem não autorizada.']);
    exit;
}

session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();
if (empty($_SESSION['bloom_admin_authenticated'])) {
    http_response_code(401);
    echo json_encode(['erro' => 'Acesso administrativo necessário.']);
    exit;
}

$configFile = __DIR__ . '/config.php';
if (!is_file($configFile)) {
    http_response_code(500);
    echo json_encode(['erro' => 'Configure api/config.php na hospedagem.']);
    exit;
}

$config = require $configFile;

$token = (string) ($config['token'] ?? '');
$providedToken = (string) ($_SERVER['HTTP_X_BLOOM_TOKEN'] ?? '');
if ($token === '' || !hash_equals($token, $providedToken)) {
    http_response_code(403);
    echo json_encode(['erro' => 'Token da API inválido.']);
    exit;
}

/**
 * Se o valor for uma imagem embutida em base64, salva como arquivo em /uploads
 * e devolve o caminho relativo. Caso contrário (já é um caminho, ou está vazio),
 * devolve o valor original sem alteração — por isso é seguro rodar mais de uma vez.
 */
function migrarCampoImagem(string $valor, string $pasta): string
{
    if (!preg_match('/^data:image\/(png|jpe?g|webp);base64,(.+)$/', $valor, $m)) {
        return $valor;
    }
    $binario = base64_decode($m[2], true);
    if ($binario === false || $binario === '') {
        return $valor;
    }
    $info = @getimagesizefromstring($binario);
    if ($info === false) {
        return $valor;
    }
    $extensoes = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    $extensao = $extensoes[$info['mime']] ?? null;
    if ($extensao === null) {
        return $valor;
    }
    $nomeArquivo = substr(hash('sha256', $binario), 0, 32) . '.' . $extensao;
    $pastaBase = __DIR__ . '/../uploads/' . $pasta;
    if (!is_dir($pastaBase) && !@mkdir($pastaBase, 0755, true) && !is_dir($pastaBase)) {
        return $valor;
    }
    $caminhoArquivo = $pastaBase . '/' . $nomeArquivo;
    if (!is_file($caminhoArquivo) && file_put_contents($caminhoArquivo, $binario, LOCK_EX) === false) {
        return $valor;
    }
    return 'uploads/' . $pasta . '/' . $nomeArquivo;
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
    ]);
} catch (Throwable $erro) {
    http_response_code(500);
    error_log('[Bloom API] migrar-fotos: ' . $erro->getMessage());
    echo json_encode(['erro' => 'Não foi possível processar a solicitação.'], JSON_UNESCAPED_UNICODE);
}
