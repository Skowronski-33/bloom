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
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');
if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
    header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
}

$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (!in_array($metodo, ['GET', 'POST', 'OPTIONS'], true)) {
    http_response_code(405);
    header('Allow: GET, POST, OPTIONS');
    echo json_encode(['erro' => 'Método não permitido.']);
    exit;
}

if ($metodo === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($metodo === 'POST' && $origem !== '' && $origem !== $origemPermitida) {
    http_response_code(403);
    echo json_encode(['erro' => 'Origem não autorizada.']);
    exit;
}

if ($metodo === 'POST') {
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
}

$configFile = __DIR__ . '/config.php';
if (!is_file($configFile)) {
    http_response_code(500);
    echo json_encode(['erro' => 'Configure api/config.php na hospedagem.']);
    exit;
}

$config = require $configFile;

if ($metodo === 'POST') {
    $token = (string) ($config['token'] ?? '');
    $providedToken = (string) ($_SERVER['HTTP_X_BLOOM_TOKEN'] ?? '');
    if ($token === '' || !hash_equals($token, $providedToken)) {
        http_response_code(403);
        echo json_encode(['erro' => 'Token da API inválido.']);
        exit;
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