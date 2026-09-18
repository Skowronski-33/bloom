# Banco local para testar a Bloom

## Teste sem banco

Para testar a interface sem instalar ou configurar MySQL, use o painel pelo endereço `http://localhost/bloom/bloom-painel.html`. A importação da planilha fica salva no `localStorage` deste navegador e é compartilhada com a vitrine aberta em `http://localhost/bloom/index.html`.

Esse modo é específico para testes locais: os dados ficam apenas neste navegador. Para publicar na Hostinger, siga as etapas de banco e API abaixo.

O projeto pode ser testado no disco `D:`. Para manter o teste igual ao ambiente da Hostinger, use MySQL ou MariaDB local.

## 1. Instalar o ambiente

Instale XAMPP, WampServer ou MySQL/MariaDB. O ambiente precisa ter:

- Apache ou outro servidor web;
- PHP com `mysqli` habilitado;
- MySQL ou MariaDB.

O PHP local já possui `mysqli`, mas o servidor MySQL ainda precisa estar instalado e iniciado.

## 2. Criar o banco

No phpMyAdmin, crie um banco chamado `bloom` com `utf8mb4` e importe `api/schema.sql`.

Pela linha de comando, se o cliente MySQL estiver disponível:

```powershell
mysql -u root -p -e "CREATE DATABASE bloom CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
Get-Content api/schema.sql | mysql -u root -p bloom
```

## 3. Configurar a API local

Copie `api/config.local.example.php` para `api/config.php` e confira usuário e senha do seu MySQL local.

Atenção: `api/config.php` é específico da máquina e não deve ser enviado para a Hostinger nem publicado.

## 4. Copiar e servir o projeto

No seu Apache atual, o documento raiz é `C:\Apache\htdocs` e a porta é `80`. Copie a pasta do projeto para:

```text
C:\Apache\htdocs\bloom
```

Não substitua o `index.php` usado para o phpinfo. Acesse o projeto por:

```text
http://localhost/bloom/index.html
http://localhost/bloom/bloom-painel.html
```

## 5. Servir o projeto no disco D:

É possível manter os arquivos em:

```text
D:\DEVS\PWP\Bloom\Separados
```

Configure o Apache com um VirtualHost apontando para essa pasta ou use a pasta pública do Apache. O navegador precisa abrir o projeto por `http://localhost/...`; abrir o HTML diretamente com `file:///` não executa a API PHP.

## 6. Configurar o painel

No `js/painel.js`, coloque o mesmo token usado em `api/config.php`:

```js
const API_TOKEN = 'bloom-token-local-troque-este-valor';
```

Abra o painel pelo servidor web, importe `PRODUTOS BLOOM.xls` e aguarde a confirmação. A importação gravará os produtos no banco local.

## 7. Testar a loja

Depois do import, abra a loja pelo mesmo servidor, por exemplo:

```text
http://localhost/bloom/index.html
http://localhost/bloom/bloom-painel.html
```

A loja e o painel agora carregam os produtos pela API. Os produtos antigos não ficam mais embutidos nos scripts.

## 8. Antes de publicar

1. Teste a importação local.
2. Confira filtros, tamanhos, preços e disponibilidade.
3. Crie o banco na Hostinger.
4. Importe `api/schema.sql` novamente no banco online.
5. Use o `config.php` com as credenciais da Hostinger.
6. Mantenha o mesmo código do projeto e altere somente o arquivo de configuração e o token.
