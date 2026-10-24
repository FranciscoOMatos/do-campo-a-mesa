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
    `&layer=mapnik` +
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
    utilizador
  } = useAuth();

  const carrinho = useCarrinho();

  const [
    dados,
    setDados
  ] = useState(null);

  const [
    aCarregar,
    setACarregar
  ] = useState(true);

  const [
    erro,
    setErro
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
    </>
  );
}