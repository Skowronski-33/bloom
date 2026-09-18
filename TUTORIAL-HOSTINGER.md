# Publicar a Bloom na Hostinger

Este projeto usa HTML, JavaScript, PHP e MySQL. Não é necessário instalar Laravel.

## 1. Criar o banco

No hPanel da Hostinger:

1. Abra **Bancos de dados MySQL**.
2. Crie um banco, um usuário e uma senha.
3. Anote exatamente estes dados: nome do banco, usuário, senha e servidor do banco.
4. Abra o **phpMyAdmin** do banco criado.
5. Entre na aba **Importar** e envie `api/schema.sql`.

O servidor normalmente é `localhost`, mas use o valor exibido no hPanel se for diferente.

## 2. Enviar os arquivos

No Gerenciador de arquivos, entre em `public_html` e envie a estrutura abaixo:

```text
public_html/
├── index.html
├── admin-login.html
├── bloom-painel.html
├── css/
├── js/
│   └── auth-guard.js
└── api/
    ├── auth.php
    ├── catalogo.php
    ├── config.php
    └── schema.sql
```

O arquivo `config.example.php` é apenas um modelo. Depois de enviar a pasta `api`, faça uma cópia dele com o nome `config.php`.

## 3. Configurar o PHP

Edite `api/config.php` e substitua os valores:

```php
<?php
return [
    'host' => 'localhost',
    'database' => 'NOME_DO_BANCO',
    'user' => 'USUARIO_DO_BANCO',
    'password' => 'SENHA_DO_BANCO',
    'port' => 3306,
    'token' => 'crie-uma-frase-grande-e-dificil-de-adivinhar',
    'admin_user' => 'BloomAdm',
    'admin_password_hash' => 'HASH_DA_SENHA_ADMINISTRATIVA',
];
```

O `config.php` não deve ser publicado em repositórios nem compartilhado. Ele fica somente dentro da pasta `api` no servidor.

O acesso administrativo usa usuário e senha. No `config.php` da Hostinger, mantenha `admin_user` como `BloomAdm` e copie o hash correspondente ao modelo `config.example.php`. A senha original não é salva no arquivo.

## 4. Configurar o painel

Abra `js/painel.js` e altere apenas o token:

```js
const API_TOKEN = 'crie-uma-frase-grande-e-dificil-de-adivinhar';
```

O texto precisa ser exatamente igual ao valor de `token` no `api/config.php`. A URL padrão já está correta quando o projeto está na raiz do domínio:

```js
const API_URL = 'api/catalogo.php';
```

## 5. Fazer o primeiro teste

Abra:

```text
https://bloombabyekids.com.br/api/catalogo.php
```

Se o banco estiver vazio, deve aparecer um JSON com `produtos: []`. Depois abra:

```text
https://bloombabyekids.com.br/bloom-painel.html
```

Clique em **Importar**, selecione `PRODUTOS BLOOM.xls` e aguarde a mensagem de sucesso. A planilha deve conter as colunas `CODPRODUTO`, `DESCRICAO`, `TAMANHO`, `QTDE` e `PREÇO`. `CODBARRAS` é opcional.

Depois abra a página inicial. Os produtos importados devem aparecer na vitrine.

## 6. Se o projeto ficar em uma subpasta

Se os arquivos forem enviados para `public_html/bloom/`, mantenha a mesma estrutura dentro dela. Os caminhos relativos continuam funcionando:

```text
https://bloombabyekids.com.br/bloom/index.html
https://bloombabyekids.com.br/bloom/bloom-painel.html
```

## Problemas comuns

### Erro `Configure api/config.php`

O arquivo ainda não foi criado ou está com nome errado. Ele precisa se chamar exatamente `config.php`.

### Erro de acesso ao banco

Confira nome do banco, usuário, senha e servidor no hPanel. Não use necessariamente o nome visual do domínio.

### Erro `Senha incorreta`

Confira o usuário `BloomAdm` e o valor de `admin_password_hash` no `api/config.php`.

### A vitrine continua mostrando produtos antigos

Faça uma atualização forçada do navegador. Se continuar, abra a URL da API e verifique se o JSON contém os produtos importados.

### A planilha não é aceita

Use a primeira aba do arquivo e confirme os nomes das colunas. O importador aceita `.xls`, `.xlsx` e `.csv`.

## Segurança

O token evita gravações acidentais na API, mas ele está presente no JavaScript do painel e pode ser visto pelo navegador. Para uma operação com vários administradores, o próximo passo recomendado é proteger o painel com senha da própria Hostinger ou criar login no servidor.