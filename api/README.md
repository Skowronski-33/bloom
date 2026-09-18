# Configuração na Hostinger

O passo a passo completo está em [../TUTORIAL-HOSTINGER.md](../TUTORIAL-HOSTINGER.md).

1. Crie um banco MySQL no hPanel e importe `schema.sql` no phpMyAdmin.
2. Copie `config.example.php` para `config.php` e preencha os dados do banco. Não publique `config.php` em repositório.
3. Envie a pasta `api` para a hospedagem.
4. No `js/painel.js`, altere `API_URL` e `API_TOKEN` para os valores do seu domínio e do token configurado.
5. Abra o painel, importe `PRODUTOS BLOOM.xls` e confirme a atualização. A vitrine passa a ler o mesmo catálogo.

O endpoint aceita `GET` público para a vitrine e `POST` com o cabeçalho `X-Bloom-Token` apenas para o painel.