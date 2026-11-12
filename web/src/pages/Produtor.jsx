import {
  useEffect,
  useState
} from 'react';

import {
  useParams
} from 'react-router-dom';

import CartaoProduto
  from '../components/CartaoProduto.jsx';

import {
  useCarrinho
} from '../context/CarrinhoContext.jsx';

import {
  useAuth
} from '../context/AuthContext.jsx';

import {
  api
} from '../api/client.js';

function formatarAvaliacao(
  avaliacaoMedia,
  totalAvaliacoes
) {
  if (
    avaliacaoMedia === null ||
    totalAvaliacoes === 0
  ) {
    return 'Ainda sem avaliações';
  }

  return `${Number(
    avaliacaoMedia
  ).toFixed(1)} / 5 (${totalAvaliacoes} ${
    totalAvaliacoes === 1
      ? 'avaliação'
      : 'avaliações'
  })`;
}

function formatarData(valor) {
  if (!valor) {
    return '';
  }

  return new Intl.DateTimeFormat(
    'pt-PT',
    {
      dateStyle: 'medium'
    }
  ).format(new Date(valor));
}

function Estrelas({
  classificacao
}) {
  const valor = Number(
    classificacao
  );

  const estrelas =
    Array.from(
      {
        length: 5
      },
      (_, indice) =>
        indice < valor
          ? '★'
          : '☆'
    ).join('');

  return (
    <span
      aria-label={`${valor} de 5 estrelas`}
      title={`${valor} de 5`}
    >
      {estrelas}
    </span>
  );
}

function MapaProdutor({
  localizacao,
  nome
}) {
  const lat = localizacao?.lat;
  const lng = localizacao?.lng;

  if (
    typeof lat !== 'number' ||
    typeof lng !== 'number'
  ) {
    return null;
  }

  const margem = 0.02;

  const bbox = [
    lng - margem,
    lat - margem,
    lng + margem,
    lat + margem
  ].join(',');

  const src =
    'https://www.openstreetmap.org/export/embed.html' +
    `?bbox=${encodeURIComponent(bbox)}` +
    '&layer=mapnik' +
    `&marker=${encodeURIComponent(`${lat},${lng}`)}`;

  return (
    <div className="ratio ratio-16x9 mt-3">
      <iframe
        src={src}
        title={`Localização de ${nome}`}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

export default function Produtor() {
  const {
    id
  } = useParams();

  const {
    utilizador,
    token
  } = useAuth();

  const carrinho = useCarrinho();

  const [
    dados,
    setDados
  ] = useState(null);

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
    erroAvaliacoes,
    setErroAvaliacoes
  ] = useState('');

  const [
    reviewADenunciar,
    setReviewADenunciar
  ] = useState(null);

  const [
    reviewsDenunciadas,
    setReviewsDenunciadas
  ] = useState([]);

  const [
    mensagemDenuncia,
    setMensagemDenuncia
  ] = useState('');

  const [
  formularioDenuncia,
  setFormularioDenuncia
] = useState(null);

const [
  motivoDenuncia,
  setMotivoDenuncia
] = useState('');

const [
  descricaoDenuncia,
  setDescricaoDenuncia
] = useState('');

const [
  aConsultarDenuncias,
  setAConsultarDenuncias
] = useState(Boolean(token));

const [
  erroConsultaDenuncias,
  setErroConsultaDenuncias
] = useState('');

const [
  erroDenuncia,
  setErroDenuncia
] = useState('');

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        setACarregar(true);

        const resposta = await api(
          `/producers/${id}`
        );

        if (!ativo) {
          return;
        }

        setDados(resposta);
        setErro('');
      } catch (err) {
        if (!ativo) {
          return;
        }

        setDados(null);
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
  }, [id]);

  useEffect(() => {
    let ativo = true;

    async function carregarAvaliacoes() {
      try {
        const resposta = await api(
          `/reviews?produtor=${id}`
        );

        if (!ativo) {
          return;
        }

        setAvaliacoes(resposta);
        setErroAvaliacoes('');
      } catch (err) {
        if (!ativo) {
          return;
        }

        setAvaliacoes([]);
        setErroAvaliacoes(
          err.message
        );
      }
    }

    carregarAvaliacoes();

    return () => {
      ativo = false;
    };
  }, [id]);


useEffect(() => {
  let ativo = true;

  if (!token) {
    setReviewsDenunciadas([]);
    setAConsultarDenuncias(false);
    setErroConsultaDenuncias('');
    return () => {
      ativo = false;
    };
  }

  setAConsultarDenuncias(true);
  setReviewsDenunciadas([]);
  setErroConsultaDenuncias('');

  api('/reviews/denuncias/minhas', { token })
    .then((ids) => {
      if (ativo) {
        if (!Array.isArray(ids)) {
          throw new Error('Resposta inválida da API');
        }

        setReviewsDenunciadas(ids);
      }
    })
    .catch(() => {
      if (ativo) {
        setErroConsultaDenuncias(
          'Não foi possível verificar as denúncias anteriores. Atualiza a página.'
        );
      }
    })
    .finally(() => {
      if (ativo) {
        setAConsultarDenuncias(false);
      }
    });

  return () => {
    ativo = false;
  };
}, [token]);


  function abrirFormularioDenuncia(avaliacao) {
    if (
      !token ||
      aConsultarDenuncias ||
      erroConsultaDenuncias ||
      reviewADenunciar ||
      reviewsDenunciadas.includes(avaliacao._id)
    ) {
      return;
    }

    setFormularioDenuncia(
      (atual) =>
        atual === avaliacao._id
          ? null
          : avaliacao._id
    );

    setMotivoDenuncia('');
    setDescricaoDenuncia('');
    setErroDenuncia('');
    setMensagemDenuncia('');
  }

  async function denunciarAvaliacao(evento, avaliacao) {
    evento.preventDefault();

    if (
      !token ||
      !motivoDenuncia ||
      aConsultarDenuncias ||
      erroConsultaDenuncias ||
      reviewADenunciar
    ) {
      return;
    }

    try {
      setReviewADenunciar(avaliacao._id);
      setErroDenuncia('');
      setMensagemDenuncia('');

      await api(
        `/reviews/${avaliacao._id}/denuncia`,
        {
          metodo: 'POST',
          token,
          corpo: {
            motivo: motivoDenuncia,
            descricao: descricaoDenuncia.trim()
          }
        }
      );

      setReviewsDenunciadas((atuais) => [
        ...new Set([...atuais, avaliacao._id])
      ]);

      setFormularioDenuncia(null);
      setMensagemDenuncia(
        'Avaliação denunciada com sucesso.'
      );
    } catch (err) {
      if (err.status === 409) {
        setReviewsDenunciadas((atuais) => [
          ...new Set([...atuais, avaliacao._id])
        ]);

        setFormularioDenuncia(null);
        setMensagemDenuncia(
          'Esta avaliação já tinha sido denunciada por ti.'
        );
      } else {
        setErroDenuncia(err.message);
      }
    } finally {
      setReviewADenunciar(null);
    }
  }


  if (aCarregar) {
    return (
      <p
        className="texto-secundario"
        role="status"
      >
        A carregar produtor...
      </p>
    );
  }

  if (erro) {
    return (
      <div
        className="alert alert-danger"
        role="alert"
      >
        {erro}
      </div>
    );
  }

  if (!dados) {
    return null;
  }

  const {
    produtor,
    produtos,
    avaliacaoMedia,
    totalAvaliacoes
  } = dados;

  const perfil =
    produtor.produtor;

  const nome =
    perfil.nomeExploracao ||
    produtor.nome;

  return (
    <>
      <section className="mb-5">
        <div className="card p-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between gap-4">
            <div>
              <p className="texto-secundario mb-2">
                Produtor local
              </p>

              <h1 className="mb-2">
                {nome}
              </h1>

              {perfil.localidade && (
                <p className="mb-3">
                  <strong>
                    Localidade:
                  </strong>{' '}
                  {perfil.localidade}
                </p>
              )}

              <p className="mb-0">
                <strong>
                  Avaliação:
                </strong>{' '}
                {formatarAvaliacao(
                  avaliacaoMedia,
                  totalAvaliacoes
                )}
              </p>
            </div>
          </div>

          {perfil.descricao && (
            <p className="mt-4 mb-0">
              {perfil.descricao}
            </p>
          )}

          <MapaProdutor
            localizacao={
              perfil.localizacao
            }
            nome={nome}
          />
        </div>
      </section>

      <section
        aria-labelledby="titulo-produtos-produtor"
        className="mb-5"
      >
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-end gap-2 mb-3">
          <div>
            <h2
              id="titulo-produtos-produtor"
              className="h3 mb-1"
            >
              Produtos disponíveis
            </h2>

            <p className="texto-secundario mb-0">
              {produtos.length}{' '}
              {produtos.length === 1
                ? 'produto disponível'
                : 'produtos disponíveis'}
            </p>
          </div>
        </div>

        {produtos.length > 0 ? (
          <div className="grelha-produtos">
            {produtos.map(
              (produto) => (
                <CartaoProduto
                  key={produto._id}
                  produto={produto}
                  onAdicionar={
                    utilizador?.papel ===
                    'comprador'
                      ? () =>
                          carrinho.adicionar(
                            produto
                          )
                      : undefined
                  }
                />
              )
            )}
          </div>
        ) : (
          <p
            className="texto-secundario"
            role="status"
          >
            Este produtor não tem produtos disponíveis neste momento.
          </p>
        )}
      </section>

      <section
        aria-labelledby="titulo-avaliacoes"
      >
        <div className="mb-3">
          <h2
            id="titulo-avaliacoes"
            className="h3 mb-1"
          >
            Avaliações
          </h2>

          <p className="texto-secundario mb-0">
            Opiniões de compradores que já
            receberam as suas encomendas.
          </p>
        </div>

        {erroAvaliacoes && (
          <div
            className="alert alert-danger"
            role="alert"
          >
            {erroAvaliacoes}
          </div>
        )}

        {mensagemDenuncia && (
          <div
            className="alert alert-success"
            role="status"
          >
            {mensagemDenuncia}
          </div>
        )}


        {erroConsultaDenuncias && (
          <div
            className="alert alert-warning"
            role="alert"
          >
            {erroConsultaDenuncias}
          </div>
        )}

        {erroDenuncia && (
          <div
            className="alert alert-danger"
            role="alert"
          >
            {erroDenuncia}
          </div>
        )}


        {!erroAvaliacoes &&
          avaliacoes.length === 0 && (
            <p className="texto-secundario">
              Este produtor ainda não tem
              avaliações.
            </p>
          )}

        {!erroAvaliacoes &&
          avaliacoes.map(
            (avaliacao) => (
              <article
                key={avaliacao._id}
                className="card p-3 mb-3"
              >
                <div className="d-flex flex-column flex-sm-row justify-content-between gap-2">
                  <div>
                    <div className="fw-semibold mb-1">
                      <Estrelas
                        classificacao={
                          avaliacao.classificacao
                        }
                      />{' '}
                      <span>
                        {
                          avaliacao
                            .classificacao
                        }{' '}
                        / 5
                      </span>
                    </div>

                    <p className="mb-1">
                      <strong>
                        {avaliacao.autor
                          ?.nome ||
                          'Comprador'}
                      </strong>
                    </p>

                    {avaliacao.produto
                      ?.nome && (
                      <p className="texto-secundario small mb-0">
                        Produto:{' '}
                        {
                          avaliacao
                            .produto
                            .nome
                        }
                      </p>
                    )}
                  </div>

                  <time
                    className="texto-secundario small"
                    dateTime={
                      avaliacao.createdAt
                    }
                  >
                    {formatarData(
                      avaliacao.createdAt
                    )}
                  </time>
                </div>

                {avaliacao.comentario && (
                  <p className="mt-3 mb-0">
                    “
                    {
                      avaliacao.comentario
                    }
                    ”
                  </p>
                )}

                {utilizador &&
                  String(avaliacao.autor?._id) !==
                    String(
                      utilizador._id ?? utilizador.id
                    ) && (
                    <div className="mt-3">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        disabled={
                          aConsultarDenuncias ||
                          Boolean(erroConsultaDenuncias) ||
                          Boolean(reviewADenunciar) ||
                          reviewsDenunciadas.includes(
                            avaliacao._id
                          )
                        }
                        onClick={() =>
                          abrirFormularioDenuncia(avaliacao)
                        }
                      >
                        {reviewsDenunciadas.includes(
                          avaliacao._id
                        )
                          ? 'Denunciada'
                          : aConsultarDenuncias
                            ? 'A verificar...'
                            : formularioDenuncia ===
                                avaliacao._id
                              ? 'Fechar formulário'
                              : 'Denunciar'}
                      </button>

                      {formularioDenuncia ===
                        avaliacao._id &&
                        !reviewsDenunciadas.includes(
                          avaliacao._id
                        ) && (
                          <form
                            className="border rounded p-3 mt-3"
                            onSubmit={(evento) =>
                              denunciarAvaliacao(
                                evento,
                                avaliacao
                              )
                            }
                          >
                            <h3 className="h6 mb-3">
                              Denunciar avaliação
                            </h3>

                            <div className="mb-3">
                              <label
                                className="form-label"
                                htmlFor={`motivo-${avaliacao._id}`}
                              >
                                Motivo da denúncia *
                              </label>

                              <select
                                id={`motivo-${avaliacao._id}`}
                                className="form-select"
                                value={motivoDenuncia}
                                onChange={(evento) =>
                                  setMotivoDenuncia(
                                    evento.target.value
                                  )
                                }
                                required
                              >
                                <option value="">
                                  Seleciona um motivo
                                </option>

                                <option value="linguagem_ofensiva">
                                  Linguagem ofensiva ou inadequada
                                </option>

                                <option value="informacao_falsa">
                                  Informação falsa ou enganosa
                                </option>

                                <option value="spam">
                                  Spam ou publicidade
                                </option>

                                <option value="outro">
                                  Outro motivo
                                </option>
                              </select>
                            </div>

                            <div className="mb-3">
                              <label
                                className="form-label"
                                htmlFor={`descricao-${avaliacao._id}`}
                              >
                                Descrição adicional (opcional)
                              </label>

                              <textarea
                                id={`descricao-${avaliacao._id}`}
                                className="form-control"
                                rows={3}
                                maxLength={1000}
                                value={descricaoDenuncia}
                                onChange={(evento) =>
                                  setDescricaoDenuncia(
                                    evento.target.value
                                  )
                                }
                                placeholder="Explica o motivo da denúncia..."
                              />
                            </div>

                            <div className="d-flex gap-2">
                              <button
                                type="submit"
                                className="btn btn-danger btn-sm"
                                disabled={Boolean(
                                  reviewADenunciar
                                )}
                              >
                                {reviewADenunciar ===
                                avaliacao._id
                                  ? 'A enviar...'
                                  : 'Enviar denúncia'}
                              </button>

                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                disabled={Boolean(
                                  reviewADenunciar
                                )}
                                onClick={() => {
                                  setFormularioDenuncia(null);
                                  setErroDenuncia('');
                                }}
                              >
                                Cancelar
                              </button>
                            </div>
                          </form>
                        )}
                    </div>
                  )}


              </article>
            )
          )}
      </section>
    </>
  );
}