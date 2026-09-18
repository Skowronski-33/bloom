CREATE TABLE IF NOT EXISTS bloom_catalogo (
    id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
    dados JSON NOT NULL,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO bloom_catalogo (id, dados)
VALUES (1, JSON_OBJECT('loja', 'Bloom baby kids', 'categorias', JSON_OBJECT(), 'ordem_tamanhos', JSON_ARRAY(), 'produtos', JSON_ARRAY()))
ON DUPLICATE KEY UPDATE id = id;