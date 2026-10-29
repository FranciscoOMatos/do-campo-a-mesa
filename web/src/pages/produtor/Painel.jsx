import {
  useEffect,
  useState
} from 'react';

import {
  Link
} from 'react-router-dom';

import EstadoEncomenda
  from '../../components/EstadoEncomenda.jsx';

import {
  useAuth
} from '../../context/AuthContext.jsx';

import {
  api
} from '../../api/client.js';

const ESTADOS = [
  'pendente',
  'confirmada',
  'pronta',
  'entregue'
];

const euro = (valor) =>
  Number(valor).toLocaleString('pt-PT', {
    style: 'currency',
    currency: 'EUR'
  });

function formatarData(valor) {
  if (!valor) {
    return '';
  }

  return new Intl.DateTimeFormat(
    'pt-PT',
    {
      dateStyle: 'medium',
      timeStyle: 'short'
    }
  ).format(new Date(valor));
}

function referencia(id) {
  return id
    ? id.slice(-6).toUpperCase()
    : '';
}

function proximoEstado(estado) {
  const indice =
    ESTADOS.indexOf(estado);

  if (
    indice < 0 ||
    indice === ESTADOS.length - 1
  ) {
    return null;
  }

  return ESTADOS[indice + 1];
}

function textoBotao(estado) {
  const textos = {
    confirmada:
      'Confirmar encomenda',

    pronta:
      'Marcar como pronta',

    entregue:
      'Marcar como entregue'
  };

  return textos[estado] || '';
}

function formatarAvaliacao(
  media,
  total
) {
  if (
    media === null ||
    total === 0
  ) {
    return 'Sem avaliações';
  }

  return `${Number(media).toFixed(1)} / 5`;
}

export default function PainelProdutor() {
  const {
    token
  } = useAuth();

  const [
    encomendas,
    setEncomendas
  ] = useState([]);

  const [
    estatisticas,
    setEstatisticas
  ] = useState(null);

  const [
    aCarregar,
    setACarregar
  ] = useState(true);

  const [
    aAtualizar,
    setAAtualizar
  ] = useState(null);

  const [
    erro,
    setErro
  ] = useState('');

  async function carregarDados() {
    try {
      setACarregar(true);

      const [
        dadosEncomendas,
        dadosEstatisticas
      ] = await Promise.all([
        api(
          '/orders',
          {
            token
          }
        ),

        api(
          '/producers/me/stats',
          {
            token
          }
        )
      ]);

      setEncomendas(
        dadosEncomendas
      );

      setEstatisticas(
        dadosEstatisticas
      );

      setErro('');
    } catch (err) {
      setErro(err.message);
    } finally {
      setACarregar(false);
    }
  }

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const [
          dadosEncomendas,
          dadosEstatisticas
        ] = await Promise.all([
          api(
            '/orders',
            {
              token
            }
          ),

          api(
            '/producers/me/stats',
            {
              token
            }
          )
        ]);

        if (!ativo) {
          return;
        }

        setEncomendas(
          dadosEncomendas
        );

        setEstatisticas(
          dadosEstatisticas
        );

        setErro('');
      } catch (err) {
        if (!ativo) {
          return;
        }

        setErro(err.message);
      } finally {
        if (ativo) {
          setACarregar(false);
        }
      }
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, [token]);

  async function atualizarEstatisticas() {
    const dados =
      await api(
        '/producers/me/stats',
        {
          token
        }
      );

    setEstatisticas(dados);
  }

  async function avancarEstado(
    encomenda
  ) {
    const novoEstado =
      proximoEstado(
        encomenda.estado
      );

    if (!novoEstado) {
      return;
    }

    try {
      setAAtualizar(
        encomenda._id
      );

      setErro('');

      const atualizada =
        await api(
          `/orders/${encomenda._id}/estado`,
          {
            metodo: 'PATCH',
            token,
            corpo: {
              estado: novoEstado
            }
          }
        );

      setEncomendas((atuais) =>
        atuais.map((item) =>
          item._id ===
          encomenda._id
            ? {
                ...item,
                estado:
                  atualizada.estado,
                updatedAt:
                  atualizada.updatedAt
              }
            : item
        )
      );

      await atualizarEstatisticas();
    } catch (err) {
      setErro(err.message);
    } finally {
      setAAtualizar(null);
    }
  }

  const alertasStock =
    estatisticas?.produtos
      ?.alertasStock || [];

  return (
    <>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <p className="texto-secundario mb-1">
            ÁREA DO PRODUTOR
          </p>

          <h1 className="mb-0">
            Painel do produtor
          </h1>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <Link
            to="/produtor/perfil"
            className="btn btn-outline-secondary"
          >
            Editar página pública
          </Link>

          <Link
            to="/produtor/produtos"
            className="btn btn-outline-success"
          >
            Gerir produtos
          </Link>

          <Link
            to="/produtor/leiloes/novo"
            className="btn btn-success"
          >
            Criar leilão
          </Link>
        </div>
      </div>

      {erro && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          {erro}
        </div>
      )}

      {aCarregar && (
        <p
          className="texto-secundario"
          role="status"
        >
          A carregar painel...
        </p>
      )}

      {!aCarregar &&
        estatisticas && (
          <>
            <section
              className="row g-3 mb-4"
              aria-label="Indicadores do produtor"
            >
              <div className="col-12 col-sm-6 col-lg-4 col-xl-2">
                <div className="card p-3 h-100">
                  <p className="texto-secundario mb-1">
                    Vendas
                  </p>

                  <p className="fs-3 fw-bold mb-1">
                    {euro(
                      estatisticas
                        .vendas
                        .valorTotal
                    )}
                  </p>

                  <p className="small texto-secundario mb-0">
                    {
                      estatisticas
                        .vendas
                        .encomendasEntregues
                    }{' '}
                    encomendas entregues
                  </p>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg-4 col-xl-2">
                <div className="card p-3 h-100">
                  <p className="texto-secundario mb-1">
                    Por tratar
                  </p>

                  <p className="fs-3 fw-bold mb-1">
                    {
                      estatisticas
                        .encomendas
                        .porTratar
                    }
                  </p>

                  <p className="small texto-secundario mb-0">
                    Encomendas pendentes
                  </p>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg-4 col-xl-2">
                <div className="card p-3 h-100">
                  <p className="texto-secundario mb-1">
                    Em processamento
                  </p>

                  <p className="fs-3 fw-bold mb-1">
                    {
                      estatisticas
                        .encomendas
                        .emProcessamento
                    }
                  </p>

                  <p className="small texto-secundario mb-0">
                    Confirmadas ou prontas
                  </p>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg-4 col-xl-2">
                <div className="card p-3 h-100">
                  <p className="texto-secundario mb-1">
                    Entregues
                  </p>

                  <p className="fs-3 fw-bold mb-1">
                    {
                      estatisticas
                        .encomendas
                        .entregues
                    }
                  </p>

                  <p className="small texto-secundario mb-0">
                    {
                      estatisticas
                        .encomendas
                        .total
                    }{' '}
                    encomendas no total
                  </p>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg-4 col-xl-2">
                <div className="card p-3 h-100">
                  <p className="texto-secundario mb-1">
                    Avaliação
                  </p>

                  <p className="fs-3 fw-bold mb-1">
                    {formatarAvaliacao(
                      estatisticas
                        .avaliacoes
                        .media,
                      estatisticas
                        .avaliacoes
                        .total
                    )}
                  </p>

                  <p className="small texto-secundario mb-0">
                    {
                      estatisticas
                        .avaliacoes
                        .total
                    }{' '}
                    {estatisticas
                      .avaliacoes
                      .total === 1
                      ? 'avaliação'
                      : 'avaliações'}
                  </p>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg-4 col-xl-2">
                <div className="card p-3 h-100">
                  <p className="texto-secundario mb-1">
                    Leilões ativos
                  </p>

                  <p className="fs-3 fw-bold mb-1">
                    {
                      estatisticas
                        .leiloesAtivos
                    }
                  </p>

                  <p className="small texto-secundario mb-0">
                    Em direto neste momento
                  </p>
                </div>
              </div>
            </section>

            <section
              className="mb-5"
              aria-labelledby="titulo-stock"
            >
              <div className="d-flex justify-content-between align-items-end flex-wrap gap-2 mb-3">
                <div>
                  <h2
                    id="titulo-stock"
                    className="h4 mb-1"
                  >
                    Estado do stock
                  </h2>

                  <p className="texto-secundario mb-0">
                    {
                      estatisticas
                        .produtos
                        .total
                    }{' '}
                    produtos no catálogo
                  </p>
                </div>

                <Link
                  to="/produtor/produtos"
                  className="btn btn-outline-success btn-sm"
                >
                  Gerir stock
                </Link>
              </div>

              {alertasStock.length ===
              0 ? (
                <div
                  className="alert alert-success mb-0"
                  role="status"
                >
                  Não existem produtos com
                  stock baixo.
                </div>
              ) : (
                <div
                  className="alert alert-warning mb-0"
                  role="alert"
                >
                  <p className="fw-semibold mb-2">
                    Atenção: existem{' '}
                    {
                      alertasStock.length
                    }{' '}
                    {alertasStock.length ===
                    1
                      ? 'produto com stock baixo.'
                      : 'produtos com stock baixo.'}
                  </p>

                  <ul className="mb-0">
                    {alertasStock.map(
                      (produto) => (
                        <li
                          key={
                            produto._id
                          }
                        >
                          <strong>
                            {
                              produto.nome
                            }
                          </strong>
                          :{' '}
                          {produto.stock}{' '}
                          {produto.unidade}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </section>
          </>
        )}

      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h2 className="h4 mb-0">
          Encomendas
        </h2>

        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={carregarDados}
          disabled={aCarregar}
        >
          {aCarregar
            ? 'A atualizar...'
            : 'Atualizar'}
        </button>
      </div>

      {!aCarregar &&
        encomendas.length === 0 && (
          <p>
            Ainda não existem encomendas
            para este produtor.
          </p>
        )}

      {!aCarregar &&
        encomendas.map(
          (encomenda) => {
            const seguinte =
              proximoEstado(
                encomenda.estado
              );

            const aProcessar =
              aAtualizar ===
              encomenda._id;

            return (
              <article
                key={encomenda._id}
                className="card p-3 mb-3"
              >
                <div className="d-flex flex-column flex-md-row justify-content-between gap-2 mb-3">
                  <div>
                    <h3 className="h5 mb-1">
                      Encomenda #
                      {referencia(
                        encomenda._id
                      )}
                    </h3>

                    <p className="mb-0">
                      Cliente:{' '}
                      <strong>
                        {
                          encomenda
                            .comprador
                            ?.nome
                        }
                      </strong>
                    </p>
                  </div>

                  <time
                    className="texto-secundario"
                    dateTime={
                      encomenda.createdAt
                    }
                  >
                    {formatarData(
                      encomenda.createdAt
                    )}
                  </time>
                </div>

                <EstadoEncomenda
                  estado={
                    encomenda.estado
                  }
                />

                <ul className="list-group list-group-flush my-3">
                  {encomenda.linhas.map(
                    (linha) => (
                      <li
                        key={linha._id}
                        className="list-group-item px-0 d-flex justify-content-between gap-3"
                      >
                        <span>
                          {
                            linha.quantidade
                          }
                          {' × '}
                          {linha.nome}
                        </span>

                        <span className="fw-semibold">
                          {euro(
                            linha.precoUnit *
                              linha.quantidade
                          )}
                        </span>
                      </li>
                    )
                  )}
                </ul>

                <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
                  <div>
                    <p className="mb-1">
                      <strong>
                        Entrega:
                      </strong>{' '}

                      {encomenda.entrega
                        ?.tipo ===
                      'entrega'
                        ? 'Entrega ao domicílio'
                        : 'Levantamento no produtor'}
                    </p>

                    {encomenda.entrega
                      ?.tipo ===
                      'entrega' &&
                      encomenda.entrega
                        ?.morada && (
                        <p className="texto-secundario mb-0">
                          {
                            encomenda
                              .entrega
                              .morada
                          }
                        </p>
                      )}
                  </div>

                  <div className="text-lg-end">
                    <p className="fs-5 fw-bold mb-2">
                      Total:{' '}
                      {euro(
                        encomenda.total
                      )}
                    </p>

                    {seguinte && (
                      <button
                        type="button"
                        className="btn btn-success"
                        disabled={
                          aProcessar
                        }
                        onClick={() =>
                          avancarEstado(
                            encomenda
                          )
                        }
                      >
                        {aProcessar
                          ? 'A atualizar...'
                          : textoBotao(
                              seguinte
                            )}
                      </button>
                    )}

                    {!seguinte && (
                      <span className="badge text-bg-success">
                        Encomenda concluída
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          }
        )}
    </>
  );
}