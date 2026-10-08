import {
  useEffect,
  useState
} from 'react';

import { Link } from 'react-router-dom';

import EstadoEncomenda from '../../components/EstadoEncomenda.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api/client.js';

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
  const indice = ESTADOS.indexOf(estado);

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
    confirmada: 'Confirmar encomenda',
    pronta: 'Marcar como pronta',
    entregue: 'Marcar como entregue'
  };

  return textos[estado] || '';
}

export default function PainelProdutor() {
  const { token } = useAuth();

  const [encomendas, setEncomendas] =
    useState([]);

  const [aCarregar, setACarregar] =
    useState(true);

  const [aAtualizar, setAAtualizar] =
    useState(null);

  const [erro, setErro] =
    useState('');

  async function carregarEncomendas() {
    try {
      setACarregar(true);

      const dados = await api(
        '/orders',
        {
          token
        }
      );

      setEncomendas(dados);
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
        const dados = await api(
          '/orders',
          {
            token
          }
        );

        if (!ativo) {
          return;
        }

        setEncomendas(dados);
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

  async function avancarEstado(
    encomenda
  ) {
    const novoEstado =
      proximoEstado(encomenda.estado);

    if (!novoEstado) {
      return;
    }

    try {
      setAAtualizar(encomenda._id);
      setErro('');

      const atualizada = await api(
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
          item._id === encomenda._id
            ? {
                ...item,
                estado: atualizada.estado,
                updatedAt:
                  atualizada.updatedAt
              }
            : item
        )
      );
    } catch (err) {
      setErro(err.message);
    } finally {
      setAAtualizar(null);
    }
  }

  const porTratar =
    encomendas.filter(
      (encomenda) =>
        encomenda.estado === 'pendente'
    ).length;

  const emProcessamento =
    encomendas.filter(
      (encomenda) =>
        encomenda.estado ===
          'confirmada' ||
        encomenda.estado === 'pronta'
    ).length;

  const concluidas =
    encomendas.filter(
      (encomenda) =>
        encomenda.estado === 'entregue'
    ).length;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <h1 className="mb-0">
          Painel do produtor
        </h1>

        <Link
          to="/produtor/leiloes/novo"
          className="btn btn-success"
        >
          Criar leilão
        </Link>
      </div>

      <section
        className="row g-3 mb-4"
        aria-label="Resumo das encomendas"
      >
        <div className="col-12 col-md-4">
          <div className="card p-3 h-100">
            <p className="texto-secundario mb-1">
              Por tratar
            </p>

            <p className="fs-2 fw-bold mb-0">
              {porTratar}
            </p>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card p-3 h-100">
            <p className="texto-secundario mb-1">
              Em processamento
            </p>

            <p className="fs-2 fw-bold mb-0">
              {emProcessamento}
            </p>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card p-3 h-100">
            <p className="texto-secundario mb-1">
              Entregues
            </p>

            <p className="fs-2 fw-bold mb-0">
              {concluidas}
            </p>
          </div>
        </div>
      </section>

      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h2 className="h4 mb-0">
          Encomendas
        </h2>

        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={carregarEncomendas}
          disabled={aCarregar}
        >
          Atualizar
        </button>
      </div>

      {aCarregar && (
        <p
          className="texto-secundario"
          role="status"
        >
          A carregar encomendas...
        </p>
      )}

      {erro && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          {erro}
        </div>
      )}

      {!aCarregar &&
        encomendas.length === 0 && (
          <p>
            Ainda não existem encomendas
            para este produtor.
          </p>
        )}

      {!aCarregar &&
        encomendas.map((encomenda) => {
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
                estado={encomenda.estado}
              />

              <ul className="list-group list-group-flush my-3">
                {encomenda.linhas.map(
                  (linha) => (
                    <li
                      key={linha._id}
                      className="list-group-item px-0 d-flex justify-content-between gap-3"
                    >
                      <span>
                        {linha.quantidade}
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
                      disabled={aProcessar}
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
        })}
    </>
  );
}