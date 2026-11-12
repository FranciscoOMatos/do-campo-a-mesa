# Relatório · Do Campo à Mesa

> Máximo de 20 páginas. Apagar as notas entre parênteses retos.

## 1. Introdução
[Objetivo e âmbito do trabalho.]

## 2. Arquitetura
[Diagrama de componentes: SPA, API REST, servidor de sockets, MongoDB, storage e serviços Cloud.]

## 3. Frontend e SPA
[Framework escolhida e porquê; componentes; gestão de estado; routing; abordagem Mobile First e breakpoints.]

## 4. API REST e documentação
[Recursos, verbos e códigos de estado; ligação para a Swagger UI.]

## 5. Modelo de dados
[Coleções; decisões de embedding vs linking justificadas; índices; exemplos de pesquisas.]

## 6. Segurança
[JWT, papéis, hash de passwords, HTTPS, gestão de segredos.]

## 7. Tempo real e consistência dos leilões
[Salas, eventos, presença; como garante que duas licitações simultâneas não são ambas aceites.]

## 8. Deployment na Cloud

### 8.1 Arquitetura implementada

A aplicação Do Campo à Mesa foi publicada na cloud, utilizando uma arquitetura distribuída que separa a interface, a API, a base de dados e o armazenamento de imagens.

Os serviços utilizados são:

| Componente | Serviço | Modelo |
|---|---|---|
| Frontend React/Vite | Render Static Site | Hosting/PaaS |
| API Node.js/Express | Render Web Service | PaaS |
| Base de dados MongoDB | MongoDB Atlas | DBaaS |
| Imagens dos produtos | Supabase Storage | BaaS / Object Storage |
| Backoffice Laravel | Execução local, com acesso à API publicada | Aplicação local |

Esta separação permite que o frontend comunique com a API REST através de HTTPS, enquanto o backend gere a lógica de negócio, a autenticação, os dados e os leilões em tempo real.

### 8.2 Publicação no Render

O frontend foi publicado como Static Site, com compilação através do Vite.

A API foi publicada como Web Service Node.js, utilizando o comando npm start e a porta atribuída pelo Render.

Foram configuradas variáveis de ambiente para a ligação ao MongoDB Atlas, autenticação JWT, armazenamento Supabase e comunicação com o frontend.

Endereços públicos:

- Frontend: https://do-campo-a-mesa-web.onrender.com
- API: https://do-campo-a-mesa-api-7hoe.onrender.com
- Health check: https://do-campo-a-mesa-api-7hoe.onrender.com/api/health
- Swagger: https://do-campo-a-mesa-api-7hoe.onrender.com/api-docs

O deployment da API e do frontend foi concluído e validado através do navegador e dos registos do Render.

### 8.3 MongoDB Atlas

A aplicação publicada utiliza uma base de dados dedicada ao ambiente de produção, distinta da utilizada no desenvolvimento local.

Foi configurado um utilizador de base de dados com permissões limitadas à base de produção.

Os dados de demonstração foram inicializados de forma controlada, incluindo utilizadores, produtores, produtos, encomendas, avaliações e um leilão.

Esta separação permite testar a aplicação publicada sem alterar diretamente os dados do ambiente local.

### 8.4 Supabase Storage

As imagens dos produtos são armazenadas no Supabase Storage, num bucket público destinado às fotografias do catálogo.

Foram disponibilizadas imagens para os 14 produtos de demonstração.

As referências às imagens são guardadas na base de dados, permitindo que o frontend obtenha os ficheiros através de URLs públicos.

Esta solução evita depender do armazenamento local temporário do serviço Render.

### 8.5 Leilões em tempo real

A comunicação em tempo real utiliza Socket.IO.

Foram testadas ligações Socket.IO no ambiente publicado, incluindo transporte WebSocket e atualização de licitações entre duas sessões de navegador.

Durante a validação, o leilão do Kiwi Hayward passou de 205,00 € para 210,00 €, com atualização do histórico e da contagem de licitações.

O comportamento foi observado nos dois navegadores sem necessidade de atualizar manualmente a página.

### 8.6 Integração com o Laravel

O backoffice Laravel foi mantido em execução local, mas configurado para comunicar com a API publicada no Render.

Esta integração foi realizada através da variável NODE_API_URL.

O login administrativo, o dashboard e o logout foram validados.

Foi também confirmado que o Laravel apresentava os dados do ambiente de produção, incluindo a licitação de 210,00 € e as duas licitações registadas.

Desta forma, o backoffice Laravel e o painel administrativo React podem consultar os dados disponibilizados pela mesma API cloud.

### 8.7 Testes de segurança

Foram realizados testes de autorização sobre o endpoint GET /api/admin/estatisticas, obtendo os seguintes resultados:

| Cenário | HTTP obtido | Resultado |
|---|---|---|
| Pedido sem autenticação | 401 | Acesso recusado |
| Produtor autenticado | 403 | Acesso recusado |
| Administrador autenticado | 200 | Acesso permitido |

Foi também verificado que um produtor autenticado não conseguia aceder à página administrativa do frontend.

No Laravel, foram validados o redirecionamento para login, a autenticação e a invalidação da sessão após logout.

A execução dos testes automatizados existentes no Laravel apresentou 3 testes aprovados, 4 asserções e nenhuma falha.

Estes resultados demonstram o funcionamento dos mecanismos de autorização nos cenários testados, não representando uma auditoria de segurança completa.

### 8.8 Custos e limitações

Foram utilizados planos gratuitos dos serviços cloud, sujeitos às limitações e quotas dos respetivos fornecedores.

O serviço gratuito da API no Render pode suspender a execução após períodos de inatividade, aumentando o tempo de resposta do primeiro pedido.

O backoffice Laravel não foi publicado como serviço independente e continua a necessitar de execução local.

Não foi implementado nem validado auto-scaling. Também não foi efetuada uma medição de custos de utilização em diferentes cenários de carga.

Apesar destas limitações, foi possível validar a aplicação distribuída, o armazenamento persistente das imagens, a base de dados cloud e a comunicação em tempo real.

## 9. Dificuldades e trabalho futuro

## 10. Declaração de uso de ferramentas
[Bibliotecas e assistentes de IA utilizados, e para quê.]
