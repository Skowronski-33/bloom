<?php
declare(strict_types=1);

/**
 * Decodifica uma imagem em base64 (data URL) e salva em /uploads/$pasta,
 * devolvendo o caminho relativo do arquivo. Lança InvalidArgumentException
 * para entrada inválida e RuntimeException se não conseguir gravar em disco.
 */
function bloomSalvarImagemBase64(string $dataUrl, string $pasta): string
{
    static $pastasVerificadas = [];

    if (!preg_match('/^data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+\/=]+)$/', $dataUrl, $m)) {
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
    if (!isset($pastasVerificadas[$pasta])) {
        if (!is_dir($pastaBase) && !@mkdir($pastaBase, 0755, true) && !is_dir($pastaBase)) {
            throw new RuntimeException('Não foi possível preparar a pasta de imagens.');
        }
        $pastasVerificadas[$pasta] = true;
    }

    $caminhoArquivo = $pastaBase . '/' . $nomeArquivo;
    if (!is_file($caminhoArquivo) && file_put_contents($caminhoArquivo, $binario, LOCK_EX) === false) {
        throw new RuntimeException('Não foi possível salvar a imagem.');
    }

    return 'uploads/' . $pasta . '/' . $nomeArquivo;
}
