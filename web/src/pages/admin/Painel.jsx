import {
  useCallback,
  useEffect,
  useState
} from 'react';

import { api } from '../../api/client.js';

import {
  useAuth
} from '../../context/AuthContext.jsx';

import {
  useSocket
} from '../../context/SocketContext.jsx';

import CartaoLeilao
  from '../../components/CartaoLeilao.jsx';

export default function PainelAdmin() {
  const { token } = useAuth();

  const socket =
    useSocket();

  const [estatisticas, setEstatisticas] =
    useState(null);

  const [produtores, setProdutores] =
    useState([]);

  const [reviews, setReviews] =
    useState([]);

  const [
    leiloesAtivos,
    setLeiloesAtivos
  ] = useState([]);

  const [aCarregar, setACarregar] =
    useState(true);

  const [produtorAAtualizar, setProdutorAAtualizar] =
    useState(null);

  const [reviewAAtualizar, setReviewAAtualizar] =
    useState(null);

  const [erro, setErro] =
    useState('');

  const [mensagem, setMensagem] =
    useState('');

  const carregarDados = useCallback(async () => {
    try {
      setACarregar(true);
      setErro('');

      const [
        dadosEstatisticas,
        dadosProdutores,
        dadosReviews,
        dadosLeiloes
      ] = await Promise.all([
        api(
          '/admin/estatisticas',
          { token }
        ),

        api(
          '/admin/produtores/pendentes',
          { token }
        ),

        api(
          '/admin/reviews/denunciadas',
          { token }
        ),

        api(
          '/auctions?estado=ativo'
        )
      ]);

      setEstatisticas(
        dadosEstatisticas
      );

      setProdutores(
        dadosProdutores
      );

      setReviews(
        dadosReviews
      );

      setLeiloesAtivos(
        dadosLeiloes
      );
    } catch (err) {
      setErro(err.message);
    } finally {
      setACarregar(false);
    }
  }, [token]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const atualizarLeiloes =
      async () => {
        try {
          const dados =
            await api(
              '/auctions?estado=ativo'
            );

          setLeiloesAtivos(
            dados
          );

          setEstatisticas(
            (atuais) =>
              atuais
                ? {
                    ...atuais,
                    leiloesAtivos:
                      dados.length
                  }
                : atuais
          );
        } catch {
          // Mantém os últimos dados válidos
          // caso a atualização em tempo real falhe.
        }
      };

    socket.on(
      'admin-leilao-atualizado',
      atualizarLeiloes
    );

    return () => {
      socket.off(
        'admin-leilao-atualizado',
        atualizarLeiloes
      );
    };
  }, [socket]);

  async function validarProdutor(
    produtor,
    aprovado
  ) {
    try {
      setProdutorAAtualizar(
        produtor.id
      );

      setErro('');
      setMensagem('');

      await api(
        `/admin/produtores/${produtor.id}/validacao`,
        {
          metodo: 'PATCH',
          token,
          corpo: {
            aprovado
          }
        }
      );

      setProdutores((atuais) =>
        atuais.filter(
          (item) =>
            item.id !== produtor.id
        )
      );

      setMensagem(
        aprovado
          ? `${produtor.nome} foi aprovado com sucesso.`
          : `${produtor.nome} foi rejeitado.`
      );
    } catch (err) {
      setErro(err.message);
    } finally {
      setProdutorAAtualizar(null);
    }
  }

  async function moderarReview(
    review,
    visivel
  ) {
    try {
      setReviewAAtualizar(
        review._id
      );

      setErro('');
      setMensagem('');

      await api(
        `/admin/reviews/${review._id}`,
        {
          metodo: 'PATCH',
          token,
          corpo: {
            visivel
          }
        }
      );

      setReviews((atuais) =>
        atuais.map((item) =>
          item._id === review._id
            ? {
                ...item,
                visivel
              }
            : item
        )
      );

      setMensagem(
        visivel
          ? 'A avaliação voltou a ficar visível.'
          : 'A avaliação foi ocultada.'
      );
    } catch (err) {
      setErro(err.message);
    } finally {
      setReviewAAtualizar(null);
    }
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 className="mb-1">
            Administração
          </h1>

          <p className="texto-secundario mb-0">
            Visão global e moderação da plataforma.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={carregarDados}
          disabled={aCarregar}
        >
          {aCarregar
            ? 'A atualizar...'
            : 'Atualizar'}
        </button>
      </div>

      {erro && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          {erro}
        </div>
      )}

      {mensagem && (
        <div
          className="alert alert-success"
          role="status"
        >
          {mensagem}
        </div>
      )}

      {aCarregar && (
        <p
          className="texto-secundario"
          role="status"
        >
          A carregar dados do painel...
        </p>
      )}

      {!aCarregar &&
        estatisticas && (
          <section
            className="row g-3 mb-5"
            aria-label="Estatísticas globais"
          >
            <div className="col-6 col-lg-3">
              <div className="card p-3 h-100">
                <p className="texto-secundario mb-1">
                  Utilizadores
                </p>

                <p className="fs-2 fw-bold mb-0">
                  {estatisticas.utilizadores}
                </p>
              </div>
            </div>

            <div className="col-6 col-lg-3">
              <div className="card p-3 h-100">
                <p className="texto-secundario mb-1">
                  Produtores
                </p>

                <p className="fs-2 fw-bold mb-0">
                  {estatisticas.produtores}
                </p>
              </div>
            </div>

            <div className="col-6 col-lg-3">
              <div className="card p-3 h-100">
                <p className="texto-secundario mb-1">
                  Encomendas hoje
                </p>

                <p className="fs-2 fw-bold mb-0">
                  {estatisticas.encomendasHoje}
                </p>
              </div>
            </div>

            <div className="col-6 col-lg-3">
              <div className="card p-3 h-100">
                <p className="texto-secundario mb-1">
                  Leilões ativos
                </p>

                <p className="fs-2 fw-bold mb-0">
                  {estatisticas.leiloesAtivos}
                </p>
              </div>
            </div>
          </section>
        )}

      {!aCarregar && (
        <>
          <section
            className="mb-5"
            aria-labelledby="titulo-leiloes-ativos"
          >
            <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
              <h2
                id="titulo-leiloes-ativos"
                className="h4 mb-0"
              >
                Leilões ativos
              </h2>

              <span className="badge text-bg-success">
                {leiloesAtivos.length}
              </span>
            </div>

            {leiloesAtivos.length === 0 ? (
              <div className="card p-3">
                <p className="mb-0">
                  Não existem leilões ativos
                  neste momento.
                </p>
              </div>
            ) : (
              <div className="row g-3">
                {leiloesAtivos.map(
                  (leilao) => (
                    <div
                      key={leilao._id}
                      className="col-12 col-md-6 col-xl-4"
                    >
                      <CartaoLeilao
                        leilao={leilao}
                        autenticado
                      />
                    </div>
                  )
                )}
              </div>
            )}
          </section>

          <section
            className="mb-5"
            aria-labelledby="titulo-produtores-pendentes"
          >
            <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
              <h2
                id="titulo-produtores-pendentes"
                className="h4 mb-0"
              >
                Produtores por validar
              </h2>

              <span className="badge text-bg-secondary">
                {produtores.length}
              </span>
            </div>

            {produtores.length === 0 && (
              <div className="card p-3">
                <p className="mb-0">
                  Não existem produtores a aguardar validação.
                </p>
              </div>
            )}

            <div className="row g-3">
              {produtores.map((produtor) => {
                const aProcessar =
                  produtorAAtualizar ===
                  produtor.id;

                return (
                  <div
                    key={produtor.id}
                    className="col-12 col-lg-6"
                  >
                    <article className="card p-3 h-100">
                      <div className="mb-3">
                        <h3 className="h5 mb-1">
                          {
                            produtor.produtor
                              ?.nomeExploracao ||
                            produtor.nome
                          }
                        </h3>

                        <p className="mb-1">
                          {produtor.nome}
                        </p>

                        <p className="texto-secundario mb-1">
                          {produtor.email}
                        </p>

                        {produtor.produtor
                          ?.localidade && (
                          <p className="texto-secundario mb-0">
                            {
                              produtor.produtor
                                .localidade
                            }
                          </p>
                        )}
                      </div>

                      {produtor.produtor
                        ?.descricao && (
                        <p>
                          {
                            produtor.produtor
                              .descricao
                          }
                        </p>
                      )}

                      <div className="d-flex flex-wrap gap-2 mt-auto">
                        <button
                          type="button"
                          className="btn btn-success"
                          disabled={aProcessar}
                          onClick={() =>
                            validarProdutor(
                              produtor,
                              true
                            )
                          }
                        >
                          {aProcessar
                            ? 'A processar...'
                            : 'Aprovar'}
                        </button>

                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          disabled={aProcessar}
                          onClick={() =>
                            validarProdutor(
                              produtor,
                              false
                            )
                          }
                        >
                          Rejeitar
                        </button>
                      </div>
                    </article>
                  </div>
                );
              })}
            </div>
          </section>

          <section
            aria-labelledby="titulo-reviews-denunciadas"
          >
            <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
              <h2
                id="titulo-reviews-denunciadas"
                className="h4 mb-0"
              >
                Avaliações denunciadas
              </h2>

              <span className="badge text-bg-secondary">
                {reviews.length}
              </span>
            </div>

            {reviews.length === 0 && (
              <div className="card p-3">
                <p className="mb-0">
                  Não existem avaliações denunciadas.
                </p>
              </div>
            )}

            {reviews.map((review) => {
              const aProcessar =
                reviewAAtualizar ===
                review._id;

              return (
                <article
                  key={review._id}
                  className="card p-3 mb-3"
                >
                  <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
                    <div>
                      <h3 className="h5 mb-1">
                        Avaliação de{' '}
                        {review.autor?.nome ||
                          'Utilizador'}
                      </h3>

                      <p className="mb-1">
                        <strong>
                          Classificação:
                        </strong>{' '}
                        {review.classificacao}/5
                      </p>

                      <p className="mb-1">
                        <strong>
                          Produtor:
                        </strong>{' '}
                        {review.produtor
                          ?.produtor
                          ?.nomeExploracao ||
                          review.produtor?.nome ||
                          '—'}
                      </p>

                      {review.produto?.nome && (
                        <p className="mb-1">
                          <strong>
                            Produto:
                          </strong>{' '}
                          {review.produto.nome}
                        </p>
                      )}

                      <p className="mb-1">
                        <strong>
                          Denúncias:
                        </strong>{' '}
                        {review.denuncias}
                      </p>


                      {review.detalhesDenuncias?.length > 0 && (
                        <div className="mt-3">
                          <p className="fw-semibold mb-2">
                            Motivos das denúncias:
                          </p>

                          <ul className="list-group">
                            {review.detalhesDenuncias.map(
                              (denuncia) => (
                                <li
                                  key={denuncia._id}
                                  className="list-group-item"
                                >
                                  <p className="mb-1">
                                    <strong>Motivo:</strong>{' '}
                                    {({
                                      linguagem_ofensiva:
                                        'Linguagem ofensiva ou inadequada',
                                      informacao_falsa:
                                        'Informação falsa ou enganosa',
                                      spam:
                                        'Spam ou publicidade',
                                      outro:
                                        'Outro motivo'
                                    })[denuncia.motivo] ||
                                      'Motivo não identificado'}
                                  </p>

                                  {denuncia.descricao && (
                                    <p className="mb-1">
                                      <strong>Descrição:</strong>{' '}
                                      {denuncia.descricao}
                                    </p>
                                  )}

                                  <p className="text-muted small mb-0">
                                    Denunciado por:{' '}
                                    {denuncia.autor?.nome ||
                                      'Utilizador'}
                                    {denuncia.createdAt && (
                                      <>
                                        {' — '}
                                        {new Date(
                                          denuncia.createdAt
                                        ).toLocaleDateString('pt-PT')}
                                      </>
                                    )}
                                  </p>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}

                      {review.denuncias >
                        (review.detalhesDenuncias?.length || 0) && (
                        <p className="text-muted small mt-2 mb-1">
                          Existem também denúncias anteriores
                          sem motivo registado.
                        </p>
                      )}


                      {review.comentario && (
                        <p className="mb-0 mt-3">
                          “{review.comentario}”
                        </p>
                      )}
                    </div>

                    <div className="d-flex flex-column align-items-md-end gap-2">
                      <span
                        className={
                          review.visivel
                            ? 'badge text-bg-success'
                            : 'badge text-bg-secondary'
                        }
                      >
                        {review.visivel
                          ? 'Visível'
                          : 'Oculta'}
                      </span>

                      <button
                        type="button"
                        className={
                          review.visivel
                            ? 'btn btn-outline-danger'
                            : 'btn btn-outline-success'
                        }
                        disabled={aProcessar}
                        onClick={() =>
                          moderarReview(
                            review,
                            !review.visivel
                          )
                        }
                      >
                        {aProcessar
                          ? 'A processar...'
                          : review.visivel
                            ? 'Ocultar'
                            : 'Restaurar'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        </>
      )}
    </>
  );
}
