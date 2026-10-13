## ADDED Requirements

### Requirement: Catálogo de produtos
O sistema SHALL exibir os produtos da loja exclusiva do clube em formato de grade, com nome e preço.

#### Scenario: Ver catálogo
- **WHEN** o associado abre a aba Loja
- **THEN** o sistema exibe a grade de produtos disponíveis

### Requirement: Detalhe do produto
O sistema SHALL exibir imagem, nome, preço e descrição de um produto selecionado.

#### Scenario: Abrir detalhe do produto
- **WHEN** o associado toca em um produto no catálogo
- **THEN** o sistema exibe a tela de detalhe do produto

### Requirement: Finalização de pedido via WhatsApp
O sistema SHALL finalizar o pedido de um produto redirecionando o associado para o WhatsApp, sem processar pagamento dentro do app.

#### Scenario: Enviar pedido
- **WHEN** o associado toca em "Comprar via WhatsApp" na tela de detalhe do produto
- **THEN** o sistema abre uma conversa de WhatsApp com os dados do produto pré-preenchidos e, ao retornar ao app, exibe a confirmação "Pedido enviado! Nossa equipe entrará em contato pelo WhatsApp para finalizar."
