<?php
declare(strict_types=1);

/**
 * CORS/segurança, checagem de método e autenticação de admin (sessão + token) comuns
 * a todos os endpoints da API. POST sempre exige admin autenticado; GET é público.
 * Encerra a requisição (exit) em qualquer falha. Em sucesso, devolve o método e o config.
 *
 * @param array<int,string> $metodosPermitidos
 * @return array{metodo:string,config:array}
 */
function bloomIniciar(array $metodosPermitidos): array
{
    header('Content-Type: application/json; charset=utf-8');
    $origemPermitida = 'https://bloombabyekids.com.br';
    $origem = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
    if ($origem === $origemPermitida) {
        header('Access-Control-Allow-Origin: ' . $origemPermitida);
        header('Vary: Origin');
    }
    header('Access-Control-Allow-Headers: Content-Type, X-Bloom-Token');
    header('Access-Control-Allow-Methods: ' . implode(', ', $metodosPermitidos));
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
    }

    $metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if (!in_array($metodo, $metodosPermitidos, true)) {
        http_response_code(405);
        header('Allow: ' . implode(', ', $metodosPermitidos));
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

    return ['metodo' => $metodo, 'config' => $config];
}
