# Do Campo à Mesa

Aplicação web de um mercado digital de produtores locais, desenvolvida no âmbito da unidade curricular de **Desenvolvimento Web e para a Cloud**, do Mestrado em Engenharia Informática do IPVC/ESTG.

A plataforma aproxima produtores e consumidores, permitindo consultar produtos locais, efetuar encomendas, acompanhar produtores e participar em leilões em tempo real.

## Tecnologias

| Área | Tecnologias |
|---|---|
| Frontend | React, Vite, Bootstrap 5, SASS |
| Backend | Node.js, Express |
| Base de dados | MongoDB com Mongoose |
| Autenticação | JWT + bcrypt |
| Tempo real | Socket.IO |
| Documentação API | OpenAPI 3.0 + Swagger UI |
| Mapas | OpenStreetMap |
| Imagens | Armazenamento local em desenvolvimento e suporte para Azure Blob Storage |

## Funcionalidades

A aplicação contempla quatro tipos de utilização: visitante, comprador, produtor e administrador.

| Utilizador | Funcionalidades principais |
|---|---|
| Visitante | Consultar catálogo, pesquisar e filtrar produtos, consultar produtores, páginas públicas, mapas, avaliações e leilões |
| Comprador | Registo/login, carrinho, encomendas, levantamento ou entrega, avaliações e participação em leilões |
| Produtor | Gestão dos próprios produtos e imagens, perfil público, encomendas, leilões e dashboard |
| Administrador | Validação de produtores, moderação de avaliações, estatísticas globais e acompanhamento de leilões ativos |

O catálogo permite pesquisa por produto ou produtor e filtragem por categoria, produtor, localidade, época, preço máximo e produção biológica.

Cada produtor validado possui uma página pública com descrição, localização no mapa, produtos disponíveis e avaliações dos compradores.

As encomendas apresentam os estados **Pendente**, **Confirmada**, **Pronta** e **Entregue**. Os produtores podem atualizar o estado das encomendas que lhes pertencem e os compradores podem avaliar produtos após a entrega.

Os leilões utilizam Socket.IO para comunicação em tempo real. As licitações são atualizadas de forma atómica no MongoDB para reduzir problemas de concorrência entre compradores.

## Estrutura do projeto

```text
do-campo-a-mesa/
├── api/
│   ├── openapi.yaml
│   ├── uploads/
│   └── src/
│       ├── config/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── seed/
│       │   ├── assets/
│       │   └── seed.js
│       ├── services/
│       ├── sockets/
│       ├── app.js
│       └── server.js
├── web/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       ├── pages/
│       ├── styles/
│       └── App.jsx
├── docs/
└── README.md
```

## Pré-requisitos

É necessário ter instalado **Node.js 20 ou superior**, npm e acesso a uma instância MongoDB, local ou através do MongoDB Atlas.

## Configuração da API

Criar o ficheiro `api/.env` a partir de `api/.env.example`.

Exemplo:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/do-campo-a-mesa
JWT_SECRET=trocar-por-um-segredo-longo-e-aleatorio
JWT_EXPIRES_IN=2h
CLIENT_URL=http://localhost:5173

STORAGE_CONN=
STORAGE_CONTAINER=produtos
```

`STORAGE_CONN` é opcional. Sem esta variável, as imagens são armazenadas localmente em `api/uploads/`. Quando configurada, a aplicação suporta Azure Blob Storage.

## Configuração do frontend

Criar o ficheiro `web/.env` a partir de `web/.env.example`.

```env
VITE_API_URL=http://localhost:3000
VITE_USAR_DADOS_SIMULADOS=false
```

Na utilização normal do projeto deve ser usado:

```env
VITE_USAR_DADOS_SIMULADOS=false
```

para que o frontend consuma a API real.

## Instalação

A partir da raiz do projeto:

```bash
npm --prefix api install
npm --prefix web install
```

## Dados de demonstração

O projeto inclui um seed completo e reproduzível.

Para recriar os dados de demonstração:

```bash
npm --prefix api run seed
```

**Atenção:** o seed elimina os dados existentes das coleções utilizadas pela aplicação antes de inserir os dados de demonstração.

O seed cria:

| Dados | Quantidade |
|---|---:|
| Administradores | 1 |
| Produtores validados | 5 |
| Compradores | 1 |
| Produtos | 14 |
| Imagens de produtos | 14 |
| Encomendas | 3 |
| Avaliações | 3 |
| Leilões ativos | 1 |
| Licitações iniciais | 1 |

As imagens utilizadas pelo seed encontram-se versionadas em:

```text
api/src/seed/assets/
```

Durante o seed são copiadas para `api/uploads/`, permitindo reconstruir o catálogo com imagens mesmo depois de clonar o repositório.

O leilão criado pelo seed permanece ativo durante **7 dias após a execução**, facilitando a demonstração da funcionalidade em tempo real.

## Contas de demonstração

Todas as contas criadas pelo seed utilizam a password:

```text
password123
```

| Papel | Email |
|---|---|
| Administrador | `admin@exemplo.pt` |
| Produtor — Horta da Ribeira | `horta@exemplo.pt` |
| Produtor — Mel do Soajo | `mel@exemplo.pt` |
| Produtor — Padaria do Minho | `padaria.minho@exemplo.pt` |
| Produtor — Queijaria Vale do Lima | `queijaria.valedolima@exemplo.pt` |
| Produtor — Quinta do Vale do Lima | `quinta.valedolima@exemplo.pt` |
| Comprador | `tasca@exemplo.pt` |

Estas credenciais destinam-se exclusivamente a desenvolvimento e demonstração.

## Executar a aplicação

### API

```bash
npm --prefix api run dev
```

A API fica disponível em:

```text
http://localhost:3000
```

A documentação Swagger fica disponível em:

```text
http://localhost:3000/api-docs
```

### Frontend

Noutro terminal:

```bash
npm --prefix web run dev
```

A aplicação fica disponível em:

```text
http://localhost:5173
```

## API REST

A API disponibiliza recursos para autenticação, produtos, produtores, encomendas, avaliações, leilões e administração.

A especificação encontra-se em:

```text
api/openapi.yaml
```

Pode ser consultada através da interface Swagger em:

```text
http://localhost:3000/api-docs
```

Um teste rápido ao estado da API pode ser efetuado através de:

```text
GET http://localhost:3000/api/health
```

Resposta esperada:

```json
{
  "estado": "ok"
}
```

## Autenticação e segurança

As passwords são armazenadas através de hash com **bcrypt** e nunca são devolvidas ao frontend.

Após o login é emitido um token **JWT**, utilizado tanto pela API REST como pela autenticação das ligações Socket.IO.

As rotas protegidas validam o papel do utilizador, distinguindo compradores, produtores e administradores.

O registo público permite criar contas de comprador e produtor. Uma conta de produtor necessita de validação administrativa antes de poder utilizar as funcionalidades reservadas a produtores validados.

A gestão de produtos verifica simultaneamente a autenticação, o papel de produtor, a validação da conta e a propriedade do produto.

## Leilões em tempo real

Os leilões são implementados através de Socket.IO.

Cada utilizador autenticado pode entrar numa sala associada a um leilão. As novas licitações são propagadas em tempo real aos participantes.

A atualização da licitação atual é efetuada com uma operação atómica no MongoDB, verificando o estado do leilão, a data de término e o valor da licitação anterior.

O histórico das licitações é armazenado separadamente na coleção de licitações.

Como possibilidade de evolução, operações que envolvem vários documentos, como a atualização do leilão e a criação do respetivo registo histórico, podem futuramente ser agrupadas numa transação MongoDB.

## Responsividade e acessibilidade

A interface segue uma abordagem **Mobile First**.

Os principais breakpoints utilizados são:

```text
768 px
1024 px
1280 px
```

Os estilos são organizados com SASS, utilizando variáveis, mixins, partials e nesting.

A aplicação utiliza elementos HTML semânticos, labels associados aos formulários, textos alternativos nas imagens, cabeçalhos de tabelas, regiões acessíveis e um link para saltar diretamente para o conteúdo principal.

## Armazenamento de imagens

Em desenvolvimento, os uploads são guardados em:

```text
api/uploads/
```

Esta pasta não é versionada no Git.

As imagens necessárias aos dados de demonstração estão, no entanto, versionadas em:

```text
api/src/seed/assets/
```

O serviço de imagens também possui suporte para **Azure Blob Storage** quando é configurada a variável `STORAGE_CONN`.

## Base de dados

A aplicação utiliza MongoDB através do Mongoose.

São utilizados os seguintes modelos:

```text
User
Product
Order
Review
Auction
Bid
```

As linhas das encomendas são embebidas no documento da encomenda, enquanto utilizadores, produtos, avaliações, leilões e licitações utilizam referências entre documentos quando apropriado.

## Desenvolvimento

O projeto foi desenvolvido de forma incremental, com utilização de Git e branches dedicadas às diferentes funcionalidades.

O histórico de commits e Pull Requests permite acompanhar a evolução desde a estrutura inicial até à implementação das funcionalidades finais.

## Autor

Projeto académico desenvolvido para a unidade curricular de **Desenvolvimento Web e para a Cloud** do **Mestrado em Engenharia Informática — IPVC/ESTG**.