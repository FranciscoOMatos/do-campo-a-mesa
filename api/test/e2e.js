const { io } = require('socket.io-client');

const API_URL =
  process.env.TEST_API_URL ||
  'http://localhost:3000/api';

const SOCKET_URL =
  process.env.TEST_SOCKET_URL ||
  'http://localhost:3000';

let total = 0;
let passaram = 0;

function ok(condicao, descricao) {
  total += 1;

  if (condicao) {
    passaram += 1;
    console.log(`✔ ${descricao}`);
    return;
  }

  console.error(`✘ ${descricao}`);
  throw new Error(descricao);
}

async function pedido(
  caminho,
  {
    method = 'GET',
    token,
    body
  } = {}
) {
  const headers = {};

  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  if (body !== undefined) {
    headers['Content-Type'] =
      'application/json';
  }

  const resposta = await fetch(
    `${API_URL}${caminho}`,
    {
      method,
      headers,
      body:
        body !== undefined
          ? JSON.stringify(body)
          : undefined
    }
  );

  const tipo =
    resposta.headers.get(
      'content-type'
    ) || '';

  const dados =
    resposta.status === 204
      ? null
      : tipo.includes(
          'application/json'
        )
        ? await resposta.json()
        : await resposta.text();

  return {
    status: resposta.status,
    dados,
    headers: resposta.headers
  };
}

async function login(
  email,
  password = 'password123'
) {
  return pedido(
    '/auth/login',
    {
      method: 'POST',
      body: {
        email,
        password
      }
    }
  );
}

function ligarSocket(token) {
  return new Promise(
    (resolve, reject) => {
      const socket = io(
        SOCKET_URL,
        {
          auth: {
            token
          },

          transports: [
            'websocket'
          ],

          reconnection: false,
          timeout: 3000
        }
      );

      const timeout = setTimeout(
        () => {
          socket.disconnect();

          reject(
            new Error(
              'Timeout ao ligar socket'
            )
          );
        },
        4000
      );

      socket.once(
        'connect',
        () => {
          clearTimeout(timeout);
          resolve(socket);
        }
      );

      socket.once(
        'connect_error',
        (err) => {
          clearTimeout(timeout);
          socket.disconnect();
          reject(err);
        }
      );
    }
  );
}

async function socketRecusado(token) {
  return new Promise(
    (resolve) => {
      const socket = io(
        SOCKET_URL,
        {
          auth: {
            token
          },

          transports: [
            'websocket'
          ],

          reconnection: false,
          timeout: 3000
        }
      );

      const timeout = setTimeout(
        () => {
          socket.disconnect();
          resolve(false);
        },
        4000
      );

      socket.once(
        'connect',
        () => {
          clearTimeout(timeout);
          socket.disconnect();
          resolve(false);
        }
      );

      socket.once(
        'connect_error',
        () => {
          clearTimeout(timeout);
          socket.disconnect();
          resolve(true);
        }
      );
    }
  );
}

function esperarEvento(
  socket,
  evento,
  timeoutMs = 4000
) {
  return new Promise(
    (resolve, reject) => {
      const aoReceber = (dados) => {
        clearTimeout(timeout);
        resolve(dados);
      };

      const timeout = setTimeout(
        () => {
          socket.off(
            evento,
            aoReceber
          );

          reject(
            new Error(
              `Timeout à espera do evento ${evento}`
            )
          );
        },
        timeoutMs
      );

      socket.once(
        evento,
        aoReceber
      );
    }
  );
}
function emitir(
  socket,
  evento,
  dados,
  timeoutMs = 4000
) {
  return new Promise(
    (resolve, reject) => {
      const timeout = setTimeout(
        () => {
          reject(
            new Error(
              `Timeout no ack do evento ${evento}`
            )
          );
        },
        timeoutMs
      );

      socket.emit(
        evento,
        dados,
        (resposta) => {
          clearTimeout(timeout);
          resolve(resposta);
        }
      );
    }
  );
}
async function executar() {
  console.log(
    '\nDo Campo à Mesa - testes E2E\n'
  );

  const health =
    await pedido('/health');

  ok(
    health.status === 200 &&
    health.dados?.estado === 'ok',
    'API responde em /api/health'
  );

  const loginErrado =
    await login(
      'tasca@exemplo.pt',
      'password-errada'
    );

  ok(
    loginErrado.status === 401,
    'login com password errada -> 401'
  );

  const comprador =
    await login(
      'tasca@exemplo.pt'
    );

  ok(
    comprador.status === 200 &&
    typeof comprador.dados?.token ===
      'string' &&
    comprador.dados?.utilizador
      ?.papel === 'comprador',
    'login do comprador do seed'
  );

  const admin =
    await login(
      'admin@exemplo.pt'
    );

  ok(
    admin.status === 200 &&
    admin.dados?.utilizador
      ?.papel === 'admin',
    'login do administrador do seed'
  );

  const sessao =
    await pedido(
      '/auth/eu',
      {
        token:
          comprador.dados.token
      }
    );

  ok(
    sessao.status === 200 &&
    sessao.dados?.email ===
      'tasca@exemplo.pt',
    'GET /auth/eu devolve a sessão autenticada'
  );

  const sufixo =
    `${Date.now()}-${Math
      .random()
      .toString(16)
      .slice(2)}`;

  const novoComprador =
    await pedido(
      '/auth/registo',
      {
        method: 'POST',

        body: {
          nome:
            'Comprador Teste E2E',

          email:
            `comprador.e2e.${sufixo}@exemplo.pt`,

          password:
            'password123',

          papel:
            'comprador'
        }
      }
    );

  ok(
    novoComprador.status ===
      201 &&
    novoComprador.dados
      ?.utilizador?.papel ===
      'comprador',
    'registo de comprador -> 201'
  );

  const novoProdutor =
    await pedido(
      '/auth/registo',
      {
        method: 'POST',

        body: {
          nome:
            'Produtor Teste E2E',

          email:
            `produtor.e2e.${sufixo}@exemplo.pt`,

          password:
            'password123',

          papel:
            'produtor',

          produtor: {
            nomeExploracao:
              'Exploração Teste E2E',

            localidade:
              'Ponte de Lima'
          }
        }
      }
    );

  ok(
    novoProdutor.status ===
      201 &&
    novoProdutor.dados
      ?.utilizador?.papel ===
      'produtor' &&
    novoProdutor.dados
      ?.utilizador?.produtor
      ?.validado === false,
    'registo de produtor -> pendente de validação'
  );

  const produtoBloqueado =
    await pedido(
      '/products',
      {
        method: 'POST',

        token:
          novoProdutor.dados.token,

        body: {
          nome:
            'Produto Teste',

          descricao:
            'Produto criado pelos testes.',

          categoria:
            'Fruta',

          preco: 1.5,
          unidade: 'kg',
          stock: 10,
          biologico: false,
          epocas: [
            'Primavera'
          ]
        }
      }
    );

  ok(
    produtoBloqueado.status ===
      403,
    'produtor por validar não pode publicar produtos -> 403'
  );

  const idNovoProdutor =
    novoProdutor.dados
      ?.utilizador?._id ||
    novoProdutor.dados
      ?.utilizador?.id;

  ok(
    Boolean(idNovoProdutor),
    'registo devolve o identificador do produtor'
  );

  const adminBloqueado =
    await pedido(
      '/admin/estatisticas',
      {
        token:
          comprador.dados.token
      }
    );

  ok(
    adminBloqueado.status ===
      403,
    'comprador não pode aceder ao painel administrativo -> 403'
  );

  const aprovacao =
    await pedido(
      `/admin/produtores/${idNovoProdutor}/validacao`,
      {
        method: 'PATCH',

        token:
          admin.dados.token,

        body: {
          aprovado: true
        }
      }
    );

  ok(
    aprovacao.status === 200 &&
    aprovacao.dados
      ?.produtor?.validado ===
      true,
    'admin aprova produtor pendente'
  );

  const produtoCriado =
    await pedido(
      '/products',
      {
        method: 'POST',

        token:
          novoProdutor.dados.token,

        body: {
          nome:
            `Produto Teste E2E ${sufixo}`,

          descricao:
            'Produto criado automaticamente pelos testes E2E.',

          categoria:
            'Fruta',

          preco: 1.5,
          unidade: 'kg',
          stock: 10,
          biologico: true,

          epocas: [
            'Primavera'
          ]
        }
      }
    );

  const idProdutoTeste =
    produtoCriado.dados?._id;

  ok(
    produtoCriado.status ===
      201 &&
    Boolean(idProdutoTeste) &&
    produtoCriado.headers
      .get('location')
      ?.includes(
        String(idProdutoTeste)
      ),
    'produtor validado cria produto -> 201 + Location'
  );

  const pesquisa =
    await pedido(
      `/products?q=${encodeURIComponent(
        'Produto Teste E2E'
      )}`
    );

  ok(
    pesquisa.status === 200 &&
    Array.isArray(
      pesquisa.dados
    ) &&
    pesquisa.dados.some(
      (produto) =>
        String(produto._id) ===
        String(idProdutoTeste)
    ),
    'pesquisa $regex encontra o produto criado'
  );

  const filtroPreco =
    await pedido(
      '/products?precoMax=2&ordenar=preco_asc'
    );

  const precos =
    Array.isArray(
      filtroPreco.dados
    )
      ? filtroPreco.dados.map(
          (produto) =>
            Number(produto.preco)
        )
      : [];

  ok(
    filtroPreco.status ===
      200 &&
    precos.length > 0 &&
    precos.every(
      (preco) =>
        preco <= 2
    ) &&
    precos.every(
      (preco, indice) =>
        indice === 0 ||
        precos[indice - 1] <=
          preco
    ),
    'filtro $lte e ordenação crescente por preço'
  );

  const precoInvalido =
    await pedido(
      '/products?precoMax=-1'
    );

  ok(
    precoInvalido.status ===
      400,
    'preço máximo inválido -> 400'
  );

  const produtoAtualizado =
    await pedido(
      `/products/${idProdutoTeste}`,
      {
        method: 'PUT',

        token:
          novoProdutor.dados.token,

        body: {
          preco: 1.75,
          stock: 12
        }
      }
    );

  ok(
    produtoAtualizado.status ===
      200 &&
    Number(
      produtoAtualizado.dados
        ?.preco
    ) === 1.75 &&
    Number(
      produtoAtualizado.dados
        ?.stock
    ) === 12,
    'produtor altera o próprio produto'
  );

  const outroProdutor =
    await login(
      'horta@exemplo.pt'
    );

  ok(
    outroProdutor.status ===
      200 &&
    outroProdutor.dados
      ?.utilizador?.papel ===
      'produtor',
    'login de outro produtor validado'
  );

  const alteracaoAlheia =
    await pedido(
      `/products/${idProdutoTeste}`,
      {
        method: 'PUT',

        token:
          outroProdutor.dados
            .token,

        body: {
          preco: 99
        }
      }
    );

  ok(
    alteracaoAlheia.status ===
      404,
    'outro produtor não pode alterar produto alheio -> 404'
  );

  const socketProdutor =
    await ligarSocket(
      novoProdutor.dados.token
    );

  const promessaNovaEncomenda =
    esperarEvento(
      socketProdutor,
      'nova-encomenda'
    );

  const encomendasCriadas =
    await pedido(
      '/orders',
      {
        method: 'POST',

        token:
          comprador.dados.token,

        body: {
          linhas: [
            {
              produto:
                idProdutoTeste,
              quantidade: 2
            }
          ],

          entrega: {
            tipo:
              'levantamento'
          }
        }
      }
    );

  const encomendaTeste =
    Array.isArray(
      encomendasCriadas.dados
    )
      ? encomendasCriadas
          .dados[0]
      : null;

  const idEncomendaTeste =
    encomendaTeste?._id;

  ok(
    encomendasCriadas.status ===
      201 &&
    Boolean(
      idEncomendaTeste
    ) &&
    encomendaTeste?.estado ===
      'pendente',
    'comprador cria encomenda -> 201 e estado pendente'
  );

  const notificacaoNova =
    await promessaNovaEncomenda;

  ok(
    String(
      notificacaoNova?.id
    ) ===
      String(
        idEncomendaTeste
      ),
    'produtor recebe nova-encomenda em tempo real'
  );

  socketProdutor.disconnect();

  const produtoDepoisCompra =
    await pedido(
      `/products/${idProdutoTeste}`
    );

  ok(
    produtoDepoisCompra.status ===
      200 &&
    Number(
      produtoDepoisCompra
        .dados?.stock
    ) === 10,
    'stock reservado atomicamente (12 -> 10)'
  );

  const pesquisaKiwi =
    await pedido(
      `/products?q=${encodeURIComponent(
        'Kiwi Hayward'
      )}`
    );

  const kiwi =
    Array.isArray(
      pesquisaKiwi.dados
    )
      ? pesquisaKiwi.dados.find(
          (produto) =>
            produto.nome ===
            'Kiwi Hayward'
        )
      : null;

  const encomendaSemStock =
    await pedido(
      '/orders',
      {
        method: 'POST',

        token:
          comprador.dados.token,

        body: {
          linhas: [
            {
              produto:
                idProdutoTeste,
              quantidade: 1
            },
            {
              produto:
                kiwi?._id,
              quantidade:
                999999
            }
          ],

          entrega: {
            tipo:
              'levantamento'
          }
        }
      }
    );

  ok(
    encomendaSemStock.status ===
      409,
    'stock insuficiente -> 409'
  );

  const produtoDepoisFalha =
    await pedido(
      `/products/${idProdutoTeste}`
    );

  ok(
    produtoDepoisFalha.status ===
      200 &&
    Number(
      produtoDepoisFalha
        .dados?.stock
    ) === 10,
    'stock reservado é reposto quando outra linha falha'
  );

  const minhasEncomendas =
    await pedido(
      '/orders',
      {
        token:
          comprador.dados.token
      }
    );

  ok(
    minhasEncomendas.status ===
      200 &&
    Array.isArray(
      minhasEncomendas.dados
    ) &&
    minhasEncomendas.dados.some(
      (encomenda) =>
        String(encomenda._id) ===
        String(idEncomendaTeste)
    ),
    'comprador vê a própria encomenda'
  );

  const socketCompradorEstado =
    await ligarSocket(
      comprador.dados.token
    );

  const promessaEstado =
    esperarEvento(
      socketCompradorEstado,
      'encomenda-atualizada'
    );

  const encomendaConfirmada =
    await pedido(
      `/orders/${idEncomendaTeste}/estado`,
      {
        method: 'PATCH',

        token:
          novoProdutor.dados.token,

        body: {
          estado:
            'confirmada'
        }
      }
    );

  ok(
    encomendaConfirmada.status ===
      200 &&
    encomendaConfirmada
      .dados?.estado ===
      'confirmada',
    'produtor avança encomenda para confirmada'
  );

  const notificacaoEstado =
    await promessaEstado;

  ok(
    String(
      notificacaoEstado?.id
    ) ===
      String(
        idEncomendaTeste
      ) &&
    notificacaoEstado?.estado ===
      'confirmada',
    'comprador recebe atualização da encomenda em tempo real'
  );

  socketCompradorEstado.disconnect();

  const recuoEstado =
    await pedido(
      `/orders/${idEncomendaTeste}/estado`,
      {
        method: 'PATCH',

        token:
          novoProdutor.dados.token,

        body: {
          estado:
            'pendente'
        }
      }
    );

  ok(
    recuoEstado.status ===
      409,
    'estado da encomenda não pode recuar -> 409'
  );

  const encomendaPronta =
    await pedido(
      `/orders/${idEncomendaTeste}/estado`,
      {
        method: 'PATCH',

        token:
          novoProdutor.dados.token,

        body: {
          estado:
            'pronta'
        }
      }
    );

  ok(
    encomendaPronta.status ===
      200 &&
    encomendaPronta.dados
      ?.estado === 'pronta',
    'produtor avança encomenda para pronta'
  );

  const encomendaEntregue =
    await pedido(
      `/orders/${idEncomendaTeste}/estado`,
      {
        method: 'PATCH',

        token:
          novoProdutor.dados.token,

        body: {
          estado:
            'entregue'
        }
      }
    );

  ok(
    encomendaEntregue.status ===
      200 &&
    encomendaEntregue.dados
      ?.estado === 'entregue',
    'produtor avança encomenda para entregue'
  );

  const avaliacaoCriada =
    await pedido(
      '/reviews',
      {
        method: 'POST',

        token:
          comprador.dados.token,

        body: {
          encomenda:
            idEncomendaTeste,

          produto:
            idProdutoTeste,

          classificacao: 5,

          comentario:
            'Avaliação criada automaticamente pelo teste E2E.'
        }
      }
    );

  const idAvaliacaoTeste =
    avaliacaoCriada.dados?._id;

  ok(
    avaliacaoCriada.status ===
      201 &&
    Boolean(
      idAvaliacaoTeste
    ) &&
    avaliacaoCriada.dados
      ?.classificacao === 5,
    'comprador avalia produto de encomenda entregue -> 201'
  );

  const avaliacaoDuplicada =
    await pedido(
      '/reviews',
      {
        method: 'POST',

        token:
          comprador.dados.token,

        body: {
          encomenda:
            idEncomendaTeste,

          produto:
            idProdutoTeste,

          classificacao: 4,

          comentario:
            'Tentativa duplicada.'
        }
      }
    );

  ok(
    avaliacaoDuplicada.status ===
      409,
    'não é possível avaliar duas vezes a mesma encomenda/produto -> 409'
  );

  const denuncia =
    await pedido(
      `/reviews/${idAvaliacaoTeste}/denuncia`,
      {
        method: 'POST',

        token:
          comprador.dados.token
      }
    );

  ok(
    denuncia.status ===
      204,
    'utilizador autenticado denuncia avaliação -> 204'
  );

  const denunciadas =
    await pedido(
      '/admin/reviews/denunciadas',
      {
        token:
          admin.dados.token
      }
    );

  ok(
    denunciadas.status ===
      200 &&
    Array.isArray(
      denunciadas.dados
    ) &&
    denunciadas.dados.some(
      (review) =>
        String(review._id) ===
        String(idAvaliacaoTeste)
    ),
    'admin vê avaliação denunciada'
  );

  const avaliacaoOculta =
    await pedido(
      `/admin/reviews/${idAvaliacaoTeste}`,
      {
        method: 'PATCH',

        token:
          admin.dados.token,

        body: {
          visivel: false
        }
      }
    );

  ok(
    avaliacaoOculta.status ===
      200 &&
    avaliacaoOculta.dados
      ?.visivel === false,
    'admin oculta avaliação denunciada'
  );

  const avaliacoesPublicas =
    await pedido(
      `/reviews?produto=${idProdutoTeste}`
    );

  ok(
    avaliacoesPublicas.status ===
      200 &&
    Array.isArray(
      avaliacoesPublicas.dados
    ) &&
    !avaliacoesPublicas.dados.some(
      (review) =>
        String(review._id) ===
        String(idAvaliacaoTeste)
    ),
    'avaliação ocultada deixa de aparecer publicamente'
  );

  const leilaoCriado =
    await pedido(
      '/auctions',
      {
        method: 'POST',

        token:
          novoProdutor.dados.token,

        body: {
          produto:
            idProdutoTeste,

          lote:
            `Lote Teste E2E ${sufixo}`,

          descricao:
            'Leilão criado automaticamente pelos testes E2E.',

          quantidade:
            '1 lote',

          precoBase: 100,
          incremento: 5,

          // 0,1 minuto = 6 segundos.
          // Permite testar as licitações e
          // depois confirmar o fecho automático.
          duracaoMinutos: 0.1
        }
      }
    );

  const idLeilaoTeste =
    leilaoCriado.dados?._id;

  ok(
    leilaoCriado.status ===
      201 &&
    Boolean(idLeilaoTeste) &&
    leilaoCriado.dados
      ?.estado === 'ativo' &&
    Number(
      leilaoCriado.dados
        ?.licitacaoAtual?.valor
    ) === 100,
    'produtor cria leilão ativo -> 201'
  );

  const socketCompradorA =
    await ligarSocket(
      comprador.dados.token
    );

  const socketCompradorB =
    await ligarSocket(
      novoComprador.dados.token
    );

  const estadoA =
    esperarEvento(
      socketCompradorA,
      'estado'
    );

  socketCompradorA.emit(
    'entrar',
    idLeilaoTeste
  );

  const dadosEstadoA =
    await estadoA;

  const estadoB =
    esperarEvento(
      socketCompradorB,
      'estado'
    );

  socketCompradorB.emit(
    'entrar',
    idLeilaoTeste
  );

  const dadosEstadoB =
    await estadoB;

  ok(
    String(
      dadosEstadoA?.leilao?._id
    ) ===
      String(idLeilaoTeste) &&
    String(
      dadosEstadoB?.leilao?._id
    ) ===
      String(idLeilaoTeste),
    'dois compradores entram na sala do leilão'
  );

  const promessaTerminado =
    esperarEvento(
      socketCompradorA,
      'terminado',
      15000
    );

  const promessaGanho =
    esperarEvento(
      socketCompradorA,
      'leilao-ganho',
      15000
    );

  const abaixoMinimo =
    await emitir(
      socketCompradorA,
      'licitar',
      {
        leilaoId:
          idLeilaoTeste,

        valor: 101
      }
    );

  ok(
    abaixoMinimo?.ok ===
      false,
    'licitação abaixo do mínimo é recusada'
  );

  const [
    simultaneaA,
    simultaneaB
  ] = await Promise.all([
    emitir(
      socketCompradorA,
      'licitar',
      {
        leilaoId:
          idLeilaoTeste,
        valor: 105
      }
    ),

    emitir(
      socketCompradorB,
      'licitar',
      {
        leilaoId:
          idLeilaoTeste,
        valor: 105
      }
    )
  ]);

  ok(
    [
      simultaneaA,
      simultaneaB
    ].filter(
      (resposta) =>
        resposta?.ok === true
    ).length === 1,
    'duas licitações simultâneas de 105 €: só UMA é aceite'
  );

  const historicoInicial =
    await pedido(
      `/auctions/${idLeilaoTeste}/bids`
    );

  ok(
    historicoInicial.status ===
      200 &&
    Array.isArray(
      historicoInicial.dados
    ) &&
    historicoInicial.dados
      .length === 1 &&
    Number(
      historicoInicial
        .dados[0]?.valor
    ) === 105,
    'licitação simultânea aceite fica registada uma única vez'
  );

  const licitacao110 =
    await emitir(
      socketCompradorA,
      'licitar',
      {
        leilaoId:
          idLeilaoTeste,
        valor: 110
      }
    );

  ok(
    licitacao110?.ok ===
      true,
    'licitação válida de 110 € é aceite'
  );

  const licitacao115 =
    await emitir(
      socketCompradorB,
      'licitar',
      {
        leilaoId:
          idLeilaoTeste,
        valor: 115
      }
    );

  ok(
    licitacao115?.ok ===
      true,
    'licitação válida de 115 € é aceite'
  );

  const licitacao120 =
    await emitir(
      socketCompradorA,
      'licitar',
      {
        leilaoId:
          idLeilaoTeste,
        valor: 120
      }
    );

  ok(
    licitacao120?.ok ===
      true,
    'licitação válida de 120 € é aceite'
  );

  const historicoFinal =
    await pedido(
      `/auctions/${idLeilaoTeste}/bids`
    );

  const valoresHistorico =
    Array.isArray(
      historicoFinal.dados
    )
      ? historicoFinal.dados.map(
          (bid) =>
            Number(bid.valor)
        )
      : [];

  ok(
    historicoFinal.status ===
      200 &&
    valoresHistorico.length ===
      4 &&
    valoresHistorico[0] ===
      120 &&
    valoresHistorico[1] ===
      115 &&
    valoresHistorico[2] ===
      110 &&
    valoresHistorico[3] ===
      105,
    'histórico das licitações mantém estado consistente'
  );

  const [
    terminado,
    ganho
  ] = await Promise.all([
    promessaTerminado,
    promessaGanho
  ]);

  const idCompradorSeed =
    comprador.dados
      ?.utilizador?._id ||
    comprador.dados
      ?.utilizador?.id;

  ok(
    String(
      terminado?.id
    ) ===
      String(idLeilaoTeste) &&
    String(
      terminado?.vencedor
    ) ===
      String(idCompradorSeed) &&
    Number(
      terminado?.valor
    ) === 120,
    'leilão fecha automaticamente e anuncia o vencedor'
  );

  ok(
    String(
      ganho?.id
    ) ===
      String(idLeilaoTeste) &&
    Boolean(
      ganho?.encomenda
    ),
    'vencedor recebe notificação leilao-ganho'
  );

  const leilaoDepoisFecho =
    await pedido(
      `/auctions/${idLeilaoTeste}`
    );

  const idEncomendaLeilao =
    leilaoDepoisFecho.dados
      ?.leilao?.encomenda;

  ok(
    leilaoDepoisFecho.status ===
      200 &&
    leilaoDepoisFecho.dados
      ?.leilao?.estado ===
      'terminado' &&
    Boolean(
      idEncomendaLeilao
    ),
    'leilão terminado fica ligado à encomenda criada'
  );

  const encomendaLeilao =
    await pedido(
      `/orders/${idEncomendaLeilao}`,
      {
        token:
          comprador.dados.token
      }
    );

  ok(
    encomendaLeilao.status ===
      200 &&
    encomendaLeilao.dados
      ?.origem === 'leilao' &&
    encomendaLeilao.dados
      ?.estado ===
      'confirmada' &&
    String(
      encomendaLeilao.dados
        ?.leilao
    ) ===
      String(idLeilaoTeste),
    'vencedor recebe encomenda automática do lote'
  );

  const acessoPerdedor =
    await pedido(
      `/orders/${idEncomendaLeilao}`,
      {
        token:
          novoComprador.dados.token
      }
    );

  ok(
    acessoPerdedor.status ===
      404,
    'comprador não vencedor não acede à encomenda do leilão -> 404'
  );

  socketCompradorA.disconnect();
  socketCompradorB.disconnect();

  const recusado =
    await socketRecusado(
      'token-invalido'
    );

  ok(
    recusado,
    'socket com token inválido é recusado'
  );

  const socketComprador =
    await ligarSocket(
      comprador.dados.token
    );

  ok(
    socketComprador.connected,
    'socket autenticado liga com sucesso'
  );

  socketComprador.disconnect();

  console.log(
    `\n${passaram} / ${total} verificações a passar.\n`
  );

  if (passaram !== total) {
    process.exitCode = 1;
  }
}

executar().catch(
  (err) => {
    console.error(
      '\nTeste interrompido:',
      err.message
    );

    console.error(
      `\n${passaram} / ${total} verificações a passar.\n`
    );

    process.exitCode = 1;
  }
);