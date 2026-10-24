import {
  useEffect,
  useState
} from 'react';

import EstadoEncomenda
  from '../components/EstadoEncomenda.jsx';

import {
  useAuth
} from '../context/AuthContext.jsx';

import {
  useSocket
} from '../context/SocketContext.jsx';

import {
  api
} from '../api/client.js';

const euro = (valor) =>
  Number(valor).toLocaleString(
    'pt-PT',
    {
      style: 'currency',
      currency: 'EUR'
    }
  );

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

function obterId(valor) {
  if (!valor) {
    return null;
  }

  if (typeof valor === 'string') {
    return valor;
  }

  return valor._id
    ? String(valor._id)
    : null;
}

function estrelas(classificacao) {
  const valor =
    Number(classificacao);

  return Array.from(
    {
      length: 5
    },
    (_, indice) =>
      indice < valor
        ? '★'
        : '☆'
  ).join('');
}

function chaveAvaliacao(
  encomendaId,
  produtoId
) {
  return `${encomendaId}:${produtoId}`;
}

export default function Encomendas() {
  const {
    token
  } = useAuth();

  const socket =
    useSocket();

  const [
    encomendas,
    setEncomendas
  ] = useState([]);

  const [
    avaliacoes,
    setAvaliacoes
  ] = useState([]);

  const [
    aCarregar,
    setACarregar
  ] = useState(true);

  const [
    erro,
    setErro
  ] = useState('');

  const [
    formularioAberto,
    setFormularioAberto
  ] = useState(null);

  const [
    formularios,
    setFormularios
  ] = useState({});

  const [
    aEnviar,
    setAEnviar
  ] = useState(null);

  const [
    errosAvaliacao,
    setErrosAvaliacao
  ] = useState({});

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        setACarregar(true);

        const [
          dadosEncomendas,
          dadosAvaliacoes
        ] = await Promise.all([
          api(
            '/orders',
            {
              token
            }
          ),
          api(
            '/reviews/minhas',
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

        setAvaliacoes(
          dadosAvaliacoes
        );

        setErro('');
      } catch (err) {
        if (!ativo) {
          return;
        }

        setErro(
          err.message
        );
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

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    function onEncomendaAtualizada(
      dados
    ) {
      setEncomendas(
        (atuais) =>
          atuais.map(
            (encomenda) =>
              String(
                encomenda._id
              ) ===
              String(
                dados.id
              )
                ? {
                    ...encomenda,
                    estado:
                      dados.estado
                  }
                : encomenda
          )
      );
    }

    socket.on(
      'encomenda-atualizada',
      onEncomendaAtualizada
    );

    return () => {
      socket.off(
        'encomenda-atualizada',
        onEncomendaAtualizada
      );
    };
  }, [socket]);

  function encontrarAvaliacao(
    encomendaId,
    produtoId
  ) {
    return avaliacoes.find(
      (avaliacao) =>
        String(
          obterId(
            avaliacao.encomenda
          )
        ) ===
          String(encomendaId) &&
        String(
          obterId(
            avaliacao.produto
          )
        ) ===
          String(produtoId)
    );
  }

  function abrirFormulario(
    chave
  ) {
    setFormularioAberto(
      chave
    );

    setFormularios(
      (atuais) => ({
        ...atuais,
        [chave]:
          atuais[chave] || {
            classificacao: '5',
            comentario: ''
          }
      })
    );

    setErrosAvaliacao(
      (atuais) => ({
        ...atuais,
        [chave]: ''
      })
    );
  }

  function fecharFormulario() {
    setFormularioAberto(
      null
    );
  }

  function atualizarFormulario(
    chave,
    campo,
    valor
  ) {
    setFormularios(
      (atuais) => ({
        ...atuais,
        [chave]: {
          ...atuais[chave],
          [campo]: valor
        }
      })
    );
  }

  async function enviarAvaliacao(
    event,
    encomendaId,
    produtoId,
    chave
  ) {
    event.preventDefault();

    const formulario =
      formularios[chave];

    if (!formulario) {
      return;
    }

    try {
      setAEnviar(chave);

      setErrosAvaliacao(
        (atuais) => ({
          ...atuais,
          [chave]: ''
        })
      );

      const novaAvaliacao =
        await api(
          '/reviews',
          {
            metodo: 'POST',
            token,
            corpo: {
              encomenda:
                encomendaId,
              produto:
                produtoId,
              classificacao:
                Number(
                  formulario
                    .classificacao
                ),
              comentario:
                formulario
                  .comentario
            }
          }
        );

      setAvaliacoes(
        (atuais) => [
          novaAvaliacao,
          ...atuais
        ]
      );

      setFormularioAberto(
        null
      );
    } catch (err) {
      setErrosAvaliacao(
        (atuais) => ({
          ...atuais,
          [chave]:
            err.message
        })
      );
    } finally {
      setAEnviar(null);
    }
  }

  return (
    <>
      <h1 className="mb-4">
        Encomendas
      </h1>

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
        !erro &&
        encomendas.length === 0 && (
          <p>
            Ainda não tem encomendas.
          </p>
        )}

      {!aCarregar &&
        !erro &&
        encomendas.map(
          (encomenda) => {
            const produtor =
              encomenda.produtor
                ?.produtor
                ?.nomeExploracao ||
              encomenda.produtor
                ?.nome ||
              'Produtor';

            const levantamento =
              encomenda.entrega
                ?.tipo ===
              'levantamento';

            const entregue =
              encomenda.estado ===
              'entregue';

            return (
              <article
                key={
                  encomenda._id
                }
                className="card p-3 mb-3"
              >
                <div className="d-flex flex-column flex-md-row justify-content-between gap-2 mb-3">
                  <div>
                    <h2 className="h5 mb-1">
                      Encomenda #
                      {referencia(
                        encomenda._id
                      )}
                    </h2>

                    <p className="mb-0">
                      {produtor}
                    </p>
                  </div>

                  <time
                    className="texto-secundario"
                    dateTime={
                      encomenda
                        .createdAt
                    }
                  >
                    {formatarData(
                      encomenda
                        .createdAt
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
                    (
                      linha,
                      indice
                    ) => {
                      const produtoId =
                        obterId(
                          linha.produto
                        );

                      const chave =
                        produtoId
                          ? chaveAvaliacao(
                              encomenda._id,
                              produtoId
                            )
                          : null;

                      const avaliacao =
                        produtoId
                          ? encontrarAvaliacao(
                              encomenda._id,
                              produtoId
                            )
                          : null;

                      const formulario =
                        chave
                          ? formularios[
                              chave
                            ]
                          : null;

                      const idLinha =
                        linha._id ||
                        `${encomenda._id}-${indice}`;

                      return (
                        <li
                          key={
                            idLinha
                          }
                          className="list-group-item px-0"
                        >
                          <div className="d-flex justify-content-between gap-3">
                            <span>
                              {
                                linha.quantidade
                              }
                              {' × '}
                              {
                                linha.nome
                              }
                            </span>

                            <span className="fw-semibold">
                              {euro(
                                linha.precoUnit *
                                  linha.quantidade
                              )}
                            </span>
                          </div>

                          {entregue &&
                            produtoId &&
                            avaliacao && (
                              <div className="mt-2">
                                <span
                                  className="fw-semibold"
                                  aria-label={`${avaliacao.classificacao} de 5 estrelas`}
                                >
                                  {estrelas(
                                    avaliacao.classificacao
                                  )}
                                </span>{' '}

                                <span className="texto-secundario">
                                  Avaliado
                                </span>
                              </div>
                            )}

                          {entregue &&
                            produtoId &&
                            !avaliacao &&
                            formularioAberto !==
                              chave && (
                              <div className="mt-2">
                                <button
                                  type="button"
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={() =>
                                    abrirFormulario(
                                      chave
                                    )
                                  }
                                >
                                  Avaliar produto
                                </button>
                              </div>
                            )}

                          {entregue &&
                            produtoId &&
                            !avaliacao &&
                            formularioAberto ===
                              chave &&
                            formulario && (
                              <form
                                className="mt-3 border-top pt-3"
                                onSubmit={(
                                  event
                                ) =>
                                  enviarAvaliacao(
                                    event,
                                    encomenda._id,
                                    produtoId,
                                    chave
                                  )
                                }
                              >
                                <h3 className="h6">
                                  Avaliar{' '}
                                  {
                                    linha.nome
                                  }
                                </h3>

                                <div className="mb-3">
                                  <label
                                    className="form-label"
                                    htmlFor={`classificacao-${idLinha}`}
                                  >
                                    Classificação
                                  </label>

                                  <select
                                    id={`classificacao-${idLinha}`}
                                    className="form-select"
                                    value={
                                      formulario
                                        .classificacao
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      atualizarFormulario(
                                        chave,
                                        'classificacao',
                                        event
                                          .target
                                          .value
                                      )
                                    }
                                  >
                                    <option value="5">
                                      5 - Excelente
                                    </option>

                                    <option value="4">
                                      4 - Muito bom
                                    </option>

                                    <option value="3">
                                      3 - Bom
                                    </option>

                                    <option value="2">
                                      2 - Razoável
                                    </option>

                                    <option value="1">
                                      1 - Mau
                                    </option>
                                  </select>
                                </div>

                                <div className="mb-3">
                                  <label
                                    className="form-label"
                                    htmlFor={`comentario-${idLinha}`}
                                  >
                                    Comentário
                                  </label>

                                  <textarea
                                    id={`comentario-${idLinha}`}
                                    className="form-control"
                                    rows="3"
                                    maxLength="1000"
                                    placeholder="Conte como foi a sua experiência com este produto..."
                                    value={
                                      formulario
                                        .comentario
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      atualizarFormulario(
                                        chave,
                                        'comentario',
                                        event
                                          .target
                                          .value
                                      )
                                    }
                                  />
                                </div>

                                {errosAvaliacao[
                                  chave
                                ] && (
                                  <div
                                    className="alert alert-danger py-2"
                                    role="alert"
                                  >
                                    {
                                      errosAvaliacao[
                                        chave
                                      ]
                                    }
                                  </div>
                                )}

                                <div className="d-flex flex-wrap gap-2">
                                  <button
                                    type="submit"
                                    className="btn btn-primary btn-sm"
                                    disabled={
                                      aEnviar ===
                                      chave
                                    }
                                  >
                                    {aEnviar ===
                                    chave
                                      ? 'A enviar...'
                                      : 'Enviar avaliação'}
                                  </button>

                                  <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={
                                      fecharFormulario
                                    }
                                    disabled={
                                      aEnviar ===
                                      chave
                                    }
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </form>
                            )}
                        </li>
                      );
                    }
                  )}
                </ul>

                <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
                  <div>
                    <p className="mb-1">
                      <strong>
                        Entrega:
                      </strong>{' '}
                      {levantamento
                        ? 'Levantamento no produtor'
                        : 'Entrega ao domicílio'}
                    </p>

                    {!levantamento &&
                      encomenda
                        .entrega
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

                  <p className="fs-5 fw-bold mb-0">
                    Total:{' '}
                    {euro(
                      encomenda.total
                    )}
                  </p>
                </div>
              </article>
            );
          }
        )}
    </>
  );
}