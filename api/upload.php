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

    if (!preg_match('/^data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+\/=]+)$/', $imagem, $m)) {
        throw new InvalidArgumentException('Formato de imagem inválido.');
    }

    $binario = base64_decode($m[2], true);
    if ($binario === false || $binario === '') {
        throw new InvalidArgumentException('Não foi possível ler a imagem.');
    }
    if (strlen($binario) > 4 * 1024 * 1024) {
        throw new InvalidArgumentException('Imagem muito grande.');
    }

    $info = getimagesizefromstring($binario);
    if ($info === false) {
        throw new InvalidArgumentException('Arquivo não é uma imagem válida.');
    }

    $extensoes = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    $extensao = $extensoes[$info['mime']] ?? null;
    if ($extensao === null) {
        throw new InvalidArgumentException('Formato de imagem não suportado.');
    }

    $nomeArquivo = substr(hash('sha256', $binario), 0, 32) . '.' . $extensao;
    $pastaBase = __DIR__ . '/../uploads/' . $pasta;
    if (!is_dir($pastaBase) && !@mkdir($pastaBase, 0755, true) && !is_dir($pastaBase)) {
        throw new RuntimeException('Não foi possível preparar a pasta de imagens.');
    }

    $caminhoArquivo = $pastaBase . '/' . $nomeArquivo;
    if (!is_file($caminhoArquivo) && file_put_contents($caminhoArquivo, $binario, LOCK_EX) === false) {
        throw new RuntimeException('Não foi possível salvar a imagem.');
    }

    echo json_encode(['ok' => true, 'url' => 'uploads/' . $pasta . '/' . $nomeArquivo]);
} catch (Throwable $erro) {
    $codigo = $erro instanceof InvalidArgumentException ? 422 : 500;
    http_response_code($codigo);
    error_log('[Bloom API] upload: ' . $erro->getMessage());
    $mensagem = $erro instanceof InvalidArgumentException ? $erro->getMessage() : 'Não foi possível processar a imagem.';
    echo json_encode(['erro' => $mensagem], JSON_UNESCAPED_UNICODE);
}
