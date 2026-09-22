<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');

$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (!in_array($metodo, ['GET', 'POST', 'DELETE'], true)) {
    http_response_code(405);
    header('Allow: GET, POST, DELETE');
    echo json_encode(['erro' => 'Método não permitido.']);
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
$configFile = __DIR__ . '/config.php';

if (!is_file($configFile)) {
    http_response_code(500);
    echo json_encode(['erro' => 'Configure api/config.php na hospedagem.']);
    exit;
}

$config = require $configFile;

if ($metodo === 'GET') {
    echo json_encode(['autenticado' => !empty($_SESSION['bloom_admin_authenticated'])]);
    exit;
}

if ($metodo === 'DELETE') {
    $_SESSION = [];
    session_destroy();
    echo json_encode(['ok' => true]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido.']);
    exit;
}

$dados = json_decode(file_get_contents('php://input'), true);
$usuario = is_array($dados) ? (string) ($dados['usuario'] ?? '') : '';
$senha = is_array($dados) ? (string) ($dados['senha'] ?? '') : '';
$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$chaveLimite = hash('sha256', $ip . '|' . $usuario);
$limiteArquivo = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'bloom-login-' . $chaveLimite . '.json';
$agora = time();
$tentativas = [];
if (is_file($limiteArquivo)) {
    $tentativas = json_decode((string) file_get_contents($limiteArquivo), true) ?: [];
}
$tentativas = array_values(array_filter($tentativas, static fn ($tempo) => is_int($tempo) && $tempo > $agora - 900));
if (count($tentativas) >= 5) {
    http_response_code(429);
    header('Retry-After: 900');
    echo json_encode(['erro' => 'Muitas tentativas. Tente novamente mais tarde.']);
    exit;
}

$adminUser = (string) ($config['admin_user'] ?? '');
$hash = (string) ($config['admin_password_hash'] ?? '');

if ($adminUser === '' || !hash_equals($adminUser, $usuario) || $hash === '' || strpos($hash, 'COLE_AQUI_') === 0 || !password_verify($senha, $hash)) {
    $tentativas[] = $agora;
    @file_put_contents($limiteArquivo, json_encode($tentativas), LOCK_EX);
    usleep(500000);
    http_response_code(401);
    echo json_encode(['erro' => 'Senha incorreta.']);
    exit;
}

@unlink($limiteArquivo);
session_regenerate_id(true);
$_SESSION['bloom_admin_authenticated'] = true;
echo json_encode(['ok' => true]);