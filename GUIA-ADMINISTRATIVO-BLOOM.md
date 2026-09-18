# Guia administrativo Bloom baby kids

## Objetivo

Este guia explica como manter os produtos da Bloom no painel administrativo da loja publicada na Hostinger.

## Acesso ao painel

Abra o endereço administrativo da Bloom:

```text
https://bloombabyekids.com.br/bloom-painel.html
```

Digite o usuário e a senha administrativa na tela de login. O usuário configurado atualmente é `BloomAdm`. A senha não fica neste guia; ela deve ser informada pela pessoa responsável pela hospedagem.

O painel deve ser usado somente pela equipe da Bloom. A vitrine pública fica em:

```text
https://bloombabyekids.com.br/
```

Se o projeto estiver em uma subpasta, acrescente o nome da pasta aos dois endereços.


## Visão geral do painel

O painel permite:

- Consultar a quantidade de produtos cadastrados.
- Filtrar por categoria e situação.
- Buscar por nome, categoria, cor ou tamanho.
- Cadastrar uma nova peça.
- Editar produto, foto, categoria, tamanhos, preços e estoque.
- Ativar ou desativar tamanhos na vitrine.
- Cadastrar promoções por tamanho.
- Importar produtos da planilha do Siscom.
- Baixar um backup do catálogo.
- Alterar a chamada da coleção exibida na vitrine.
- Excluir produtos com confirmação.

## Importar produtos do Siscom

1. Abra o painel.
2. Clique em **Importar**.
3. Selecione a exportação de produtos com saldo, por exemplo `PRODUTOS BLOOM.xls`.
4. Aguarde a mensagem de sucesso.
5. Confira a quantidade de produtos no painel e alguns preços e estoques.

O importador aceita arquivos `.xls`, `.xlsx`, `.csv` e `.xml`. Em planilhas, ele lê a primeira aba.

## Alterar a chamada da coleção

1. Abra o painel e clique em **Textos**.
2. Edite o campo **Chamada da coleção**. Exemplo: `Coleção Verão 2027`.
3. Clique em **Salvar texto**.

O texto aparece acima do título principal da vitrine. A alteração é salva no catálogo online e não modifica os produtos. Abra a vitrine e verifique o resultado.

A planilha usa a primeira aba e deve conter estas colunas:

```text
CODPRODUTO
DESCRICAO
CODBARRAS
TAMANHO
QTDE
PREÇO
```

`CODBARRAS` é opcional. O código do produto é usado para atualizar um produto já existente em uma nova importação.

A categoria é sugerida automaticamente pela descrição. Por exemplo:

- `MACACAO`, `MACAQUINHO` ou `JARDINEIRA` -> Macacões
- `BODY` -> Body
- `VESTIDO` -> Vestidos
- `CONJUNTO` -> Conjuntos
- `CALCA`, `SHORT` ou `BERMUDA` -> Calças e shorts
- `CASACO`, `JAQUETA` ou `MOLETOM` -> Casacos e jaquetas
- `BLUSA`, `CAMISA` ou `CAMISETA` -> Blusas e camisas
- `SAPATO`, `TENIS` ou `SANDALIA` -> Calçados
- `BIQUINI`, `SUNGA` ou `MAIO` -> Praia
- `TOALHA`, `SHAMPOO` ou `SABONETE` -> Banho e higiene
- `MANTA`, `COBERTOR` ou `KIT BERCO` -> Enxoval e cama
- `CHUPETA` ou `MAMADEIRA` -> Chupeta e alimentação
- `BRINQUEDO` ou `LIVRO INFANTIL` -> Brinquedos e livros
- `PIJAMA` -> Pijamas

Depois da importação, confira as categorias manualmente. A classificação automática é uma sugestão baseada no nome do produto.

## Cadastrar uma nova peça

1. Clique em **Nova peça**.
2. Adicione uma foto, se houver.
3. Informe o nome da peça.
4. Escolha a categoria.
5. Informe a cor e o código do Siscom, se existir.
6. Cadastre cada tamanho, preço e quantidade disponível.
7. Use o botão **No site** para definir se o tamanho aparece na vitrine.
8. Clique em **Salvar**.

No editor da peça, clicar fora não fecha o modal. Para sair, use **Salvar**, **Cancelar** ou o botão **X**. Os modais de importação e de textos podem ser fechados pelo botão **Fechar** ou clicando fora da janela.

## Editar produto

1. Localize o produto pela busca ou pelos filtros.
2. Abra o menu de três pontos do produto.
3. Clique em **Editar peça**.
4. Faça as alterações.
5. Clique em **Salvar**.

## Preços diferentes por tamanho

Cada tamanho possui seu próprio preço. Exemplo:

```text
Tamanho 6  -> R$ 50,00
Tamanho 14 -> R$ 65,00
Tamanho RS -> R$ 70,00
```

A vitrine mostra uma faixa de valores quando os preços são diferentes. Ao escolher o tamanho no produto, o preço correto aparece no modal, na sacola e na mensagem do WhatsApp.

## Promoção em apenas um tamanho

A promoção deve ser preenchida na linha do tamanho correspondente.

Exemplo:

```text
Tamanho 6  -> preço R$ 199,90 | promoção R$ 50,00
Tamanho 14 -> preço R$ 250,00 | sem promoção
Tamanho RS -> preço R$ 300,00 | sem promoção
```

Na vitrine, o preço normal do tamanho em promoção aparece riscado. Os outros tamanhos continuam com seus preços normais.

Para remover uma promoção, deixe o campo de promoção vazio e salve o produto.

## Controle de disponibilidade

- Tamanho verde: disponível na vitrine.
- Tamanho riscado: fora da vitrine.
- Todos os tamanhos desativados: o produto fica fora do site.

Clique no tamanho diretamente no cartão para ativar ou desativar sua disponibilidade.

## Fotos

As fotos adicionadas no editor são comprimidas e armazenadas junto ao catálogo. Depois de salvar, elas aparecem na vitrine e no modal do produto.

Use imagens reais da peça sempre que possível. Se uma foto for removida no editor, salve o produto novamente.

## Backup do catálogo

1. Clique em **Backup** no topo do painel.
2. O navegador baixará um arquivo semelhante a:

```text
bloom-catalogo-2026-09-09.json
```

Guarde esse arquivo em local seguro. Ele contém produtos, categorias, tamanhos, preços, promoções e fotos.

O backup é para consulta e segurança. A restauração automática do JSON ainda não está disponível; para recuperar produtos, use a planilha original ou cadastre-os novamente.

## Exclusão

1. Abra o menu de três pontos.
2. Clique em **Excluir**.
3. Confirme a mensagem exibida.

Após excluir, a opção **Desfazer** aparece por alguns segundos. O backup deve ser feito antes de grandes alterações.

## Onde os dados ficam

- As alterações salvas no painel são gravadas no banco MySQL da Hostinger e ficam disponíveis para os clientes.
- A vitrine e o painel carregam o mesmo catálogo pela API; os dados não dependem do computador do administrador.
- O acesso de gravação exige login administrativo e validação interna da API.
- Faça backup antes de importações grandes ou alterações em massa.

## O que foi feito até agora

- Painel administrativo para produtos.
- Login administrativo com sessão protegida.
- Importação de arquivos XLS, XLSX, CSV e XML.
- Busca tolerante a erros de digitação.
- Filtros por categoria e situação.
- Classificação automática de categorias pela descrição.
- Categorias de roupas, calçados, maternidade, enxoval, higiene, alimentação, brinquedos e praia.
- Cadastro e edição de fotos.
- Fotos do painel exibidas na vitrine.
- Preços diferentes por tamanho.
- Promoções individuais por tamanho.
- Preço promocional e preço antigo no catálogo e no modal.
- Sacola com valores corretos por tamanho.
- Mensagem do WhatsApp com produtos, tamanhos e valores.
- Texto da coleção editável na vitrine.
- Backup do catálogo em JSON.
- Confirmação antes de excluir.
- Modal de cadastro que não fecha ao clicar fora.

## Rotina recomendada

1. Faça um backup antes de importar uma nova planilha.
2. Importe a planilha.
3. Confira categorias, fotos, preços e promoções.
4. Teste alguns tamanhos na vitrine.
5. Teste a mensagem do WhatsApp.
6. Faça outro backup depois de confirmar os dados.
