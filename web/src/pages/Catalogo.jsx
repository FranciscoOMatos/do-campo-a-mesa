// Visitante: catálogo com pesquisa e filtros
import {
  useEffect,
  useState
} from 'react';

import CartaoProduto
  from '../components/CartaoProduto.jsx';

import CartaoLeilao
  from '../components/CartaoLeilao.jsx';

import {
  useCarrinho
} from '../context/CarrinhoContext.jsx';

import {
  useAuth
} from '../context/AuthContext.jsx';

import {
  api,
  USAR_DADOS_SIMULADOS
} from '../api/client.js';

import produtosSimulados
  from '../data/produtos.json';

import { Link } from 'react-router-dom';

const CATEGORIAS = [
  'Todos',
  'Hortícolas',
  'Fruta',
  'Mel',
  'Vinho',
  'Queijo',
  'Padaria',
  'Outros'
];

const EPOCAS = [
  'Todas',
  'Primavera',
  'Verão',
  'Outono',
  'Inverno'
];

const ORDENACOES = [
  {
    valor: 'recentes',
    texto: 'Mais recentes'
  },
  {
    valor: 'preco_asc',
    texto: 'Preço: menor para maior'
  },
  {
    valor: 'preco_desc',
    texto: 'Preço: maior para menor'
  }
];

const FILTRO_INICIAL = {
  q: '',
  categoria: 'Todos',
  bio: false,
  epoca: 'Todas',
  precoMax: '',
  produtor: '',
  localidade: '',
  ordenar: 'recentes'
};

function nomeProdutor(produtor) {
  return (
    produtor?.produtor
      ?.nomeExploracao ||
    produtor?.nome ||
    ''
  );
}

function localidadeProdutor(produtor) {
  return (
    produtor?.produtor
      ?.localidade ||
    ''
  );
}

export default function Catalogo({ paginaInicial = false }) {
  const [
    produtos,
    setProdutos
  ] = useState([]);

  const [
    produtores,
    setProdutores
  ] = useState([]);

  const [
    leilaoDestaque,
    setLeilaoDestaque
  ] = useState(null);

  const [
    filtro,
    setFiltro
  ] = useState(FILTRO_INICIAL);

  const [
    erro,
    setErro
  ] = useState('');

  const carrinho =
    useCarrinho();

  const {
    utilizador
  } = useAuth();

  useEffect(() => {
    if (USAR_DADOS_SIMULADOS) {
      return;
    }

    let ativo = true;

    api('/producers')
      .then((dados) => {
        if (ativo) {
          setProdutores(dados);
        }
      })
      .catch(() => {
        if (ativo) {
          setProdutores([]);
        }
      });

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (USAR_DADOS_SIMULADOS) {
      return;
    }

    let ativo = true;

    api('/auctions?estado=ativo')
      .then((dados) => {
        if (!ativo) {
          return;
        }

        setLeilaoDestaque(
          dados.length > 0
            ? dados[0]
            : null
        );
      })
      .catch(() => {
        if (ativo) {
          setLeilaoDestaque(null);
        }
      });

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (USAR_DADOS_SIMULADOS) {
      const pesquisa =
        filtro.q
          .trim()
          .toLowerCase();

      const localidade =
        filtro.localidade
          .trim()
          .toLowerCase();

      let filtrados =
        produtosSimulados.filter(
          (produto) => {
            const nome =
              produto.nome
                ?.toLowerCase() ||
              '';

            const descricao =
              produto.descricao
                ?.toLowerCase() ||
              '';

            const produtorNome =
              nomeProdutor(
                produto.produtor
              ).toLowerCase();

            const produtorLocalidade =
              localidadeProdutor(
                produto.produtor
              ).toLowerCase();

            const produtorId =
              produto.produtor?._id ||
              produto.produtor?.id ||
              '';

            const correspondePesquisa =
              !pesquisa ||
              nome.includes(
                pesquisa
              ) ||
              descricao.includes(
                pesquisa
              ) ||
              produtorNome.includes(
                pesquisa
              );

            const correspondeCategoria =
              filtro.categoria ===
                'Todos' ||
              produto.categoria ===
                filtro.categoria;

            const correspondeBiologico =
              !filtro.bio ||
              produto.biologico;

            const correspondeEpoca =
              filtro.epoca ===
                'Todas' ||
              produto.epocas?.includes(
                filtro.epoca
              );

            const correspondePreco =
              filtro.precoMax ===
                '' ||
              produto.preco <=
                Number(
                  filtro.precoMax
                );

            const correspondeProdutor =
              !filtro.produtor ||
              produtorId ===
                filtro.produtor;

            const correspondeLocalidade =
              !localidade ||
              produtorLocalidade
                .includes(
                  localidade
                );

            return (
              correspondePesquisa &&
              correspondeCategoria &&
              correspondeBiologico &&
              correspondeEpoca &&
              correspondePreco &&
              correspondeProdutor &&
              correspondeLocalidade
            );
          }
        );

      if (
        filtro.ordenar ===
        'preco_asc'
      ) {
        filtrados = [
          ...filtrados
        ].sort(
          (a, b) =>
            a.preco - b.preco
        );
      }

      if (
        filtro.ordenar ===
        'preco_desc'
      ) {
        filtrados = [
          ...filtrados
        ].sort(
          (a, b) =>
            b.preco - a.preco
        );
      }

      setProdutos(filtrados);
      setErro('');

      return;
    }

    const parametros =
      new URLSearchParams();

    if (filtro.q.trim()) {
      parametros.set(
        'q',
        filtro.q.trim()
      );
    }

    if (
      filtro.categoria !==
      'Todos'
    ) {
      parametros.set(
        'categoria',
        filtro.categoria
      );
    }

    if (
      filtro.precoMax !== ''
    ) {
      parametros.set(
        'precoMax',
        filtro.precoMax
      );
    }

    if (filtro.bio) {
      parametros.set(
        'bio',
        'true'
      );
    }

    if (
      filtro.epoca !==
      'Todas'
    ) {
      parametros.set(
        'epoca',
        filtro.epoca
      );
    }

    if (filtro.produtor) {
      parametros.set(
        'produtor',
        filtro.produtor
      );
    }

    if (
      filtro.localidade.trim()
    ) {
      parametros.set(
        'localidade',
        filtro.localidade.trim()
      );
    }

    if (filtro.ordenar) {
      parametros.set(
        'ordenar',
        filtro.ordenar
      );
    }

    api(
      `/products?${parametros.toString()}`
    )
      .then((dados) => {
        setProdutos(dados);
        setErro('');
      })
      .catch((err) => {
        setErro(err.message);
      });
  }, [filtro]);

  const mudar =
    (campo) =>
      (evento) => {
        const valor =
          evento.target.type ===
          'checkbox'
            ? evento.target.checked
            : evento.target.value;

        setFiltro((atual) => ({
          ...atual,
          [campo]: valor
        }));
      };

  const limparFiltros = () => {
    setFiltro(
      FILTRO_INICIAL
    );
  };

  return (
    <>
      {paginaInicial && (
        <section className="destaque mb-4">
          <h1>
            Direto de quem produz,
            para a sua mesa.
          </h1>

          <p className="texto-secundario">
            Produtores do Alto Minho.
            Encomende ou dispute os lotes
            da época nos leilões em direto.
          </p>

          {leilaoDestaque && (
            <section
              className="mt-4"
              aria-labelledby="titulo-leilao-destaque"
            >
              <div className="d-flex align-items-center gap-2 mb-3">
                <span
                  className="badge text-bg-danger"
                  aria-hidden="true"
                >
                  EM DIRETO
                </span>

                <h2
                  id="titulo-leilao-destaque"
                  className="h4 mb-0"
                >
                  Leilão em destaque
                </h2>
              </div>

              <div className="row">
                <div className="col-12 col-md-8 col-lg-6">
                  <CartaoLeilao
                    leilao={leilaoDestaque}
                    autenticado={
                      Boolean(utilizador)
                    }
                  />
                </div>
              </div>
            </section>
          )}
        </section>
      )}

      {!paginaInicial && (
        <header className="mb-4">
          <h1>Produtos</h1>
          <p className="texto-secundario mb-0">
            Explore os produtos dos produtores locais do Alto Minho.
          </p>
        </header>
      )}
      {!paginaInicial && (
        <section
          className="filtros mb-4"
          aria-labelledby="titulo-filtros"
        >
          <h2
            id="titulo-filtros"
            className="visually-hidden"
          >
            Filtrar produtos
          </h2>

          <div className="w-100">
            <label
              className="visually-hidden"
              htmlFor="pesquisa"
            >
              Pesquisar produtos ou
              produtores
            </label>

            <input
              id="pesquisa"
              type="search"
              className="form-control"
              placeholder="Pesquisar produto ou produtor..."
              value={filtro.q}
              onChange={mudar('q')}
            />
          </div>

          <div
            className="d-flex flex-wrap gap-2"
            role="group"
            aria-label="Filtrar por categoria"
          >
            {CATEGORIAS.map(
              (categoria) => {
                const selecionada =
                  filtro.categoria ===
                  categoria;

                return (
                  <button
                    key={categoria}
                    type="button"
                    className={`btn btn-sm ${
                      selecionada
                        ? 'btn-dark'
                        : 'btn-outline-secondary'
                    }`}
                    aria-pressed={
                      selecionada
                    }
                    onClick={() =>
                      setFiltro(
                        (atual) => ({
                          ...atual,
                          categoria
                        })
                      )
                    }
                  >
                    {categoria}
                  </button>
                );
              }
            )}
          </div>

          <div className="row g-2 w-100 align-items-end">
            <div className="col-12 col-md-6 col-lg-3">
              <label
                htmlFor="produtor"
                className="form-label"
              >
                Produtor
              </label>

              <select
                id="produtor"
                className="form-select"
                value={
                  filtro.produtor
                }
                onChange={
                  mudar('produtor')
                }
              >
                <option value="">
                  Todos os produtores
                </option>

                {produtores.map(
                  (produtor) => (
                    <option
                      key={
                        produtor.id
                      }
                      value={
                        produtor.id
                      }
                    >
                      {produtor
                        .produtor
                        ?.nomeExploracao ||
                        produtor.nome}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <label
                htmlFor="localidade"
                className="form-label"
              >
                Localidade
              </label>

              <input
                id="localidade"
                type="search"
                className="form-control"
                placeholder="Ex.: Ponte de Lima"
                value={
                  filtro.localidade
                }
                onChange={
                  mudar('localidade')
                }
              />
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <label
                htmlFor="epoca"
                className="form-label"
              >
                Época
              </label>

              <select
                id="epoca"
                className="form-select"
                value={
                  filtro.epoca
                }
                onChange={
                  mudar('epoca')
                }
              >
                {EPOCAS.map(
                  (epoca) => (
                    <option
                      key={epoca}
                      value={epoca}
                    >
                      {epoca}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <label
                htmlFor="precoMax"
                className="form-label"
              >
                Preço máximo
              </label>

              <div className="input-group">
                <span className="input-group-text">
                  €
                </span>

                <input
                  id="precoMax"
                  type="number"
                  className="form-control"
                  min="0"
                  step="0.01"
                  placeholder="Sem limite"
                  value={
                    filtro.precoMax
                  }
                  onChange={
                    mudar('precoMax')
                  }
                />
              </div>
            </div>
          </div>

          <div className="row g-2 w-100 align-items-end">
            <div className="col-12 col-md-6">
              <label
                htmlFor="ordenar"
                className="form-label"
              >
                Ordenar
              </label>

              <select
                id="ordenar"
                className="form-select"
                value={
                  filtro.ordenar
                }
                onChange={
                  mudar('ordenar')
                }
              >
                {ORDENACOES.map(
                  (opcao) => (
                    <option
                      key={
                        opcao.valor
                      }
                      value={
                        opcao.valor
                      }
                    >
                      {opcao.texto}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="col-12 col-md-6">
              <div className="d-flex flex-wrap align-items-center gap-3 h-100 pb-2">
                <div className="form-check mb-0">
                  <input
                    id="bio"
                    className="form-check-input"
                    type="checkbox"
                    checked={
                      filtro.bio
                    }
                    onChange={
                      mudar('bio')
                    }
                  />

                  <label
                    className="form-check-label"
                    htmlFor="bio"
                  >
                    Só biológico
                  </label>
                </div>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={
                    limparFiltros
                  }
                >
                  Limpar filtros
                </button>
              </div>
            </div>
          </div>

          <p
            className="texto-secundario small mb-0"
            role="status"
            aria-live="polite"
          >
            {produtos.length}{' '}
            {produtos.length === 1
              ? 'produto encontrado'
              : 'produtos encontrados'}
          </p>
        </section>
      )}

      {paginaInicial && (
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <h2 className="h4 mb-0">Alguns dos nossos produtos</h2>
          <Link to="/produtos" className="btn btn-outline-success">
            Ver catálogo completo
          </Link>
        </div>
      )}
      {erro && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          {erro}
        </div>
      )}

      <section
        className="grelha-produtos"
        aria-labelledby="titulo-produtos"
      >
        <h2
          id="titulo-produtos"
          className="visually-hidden"
        >
          Produtos
        </h2>

        {(paginaInicial ? produtos.slice(0, 4) : produtos).map(
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
      </section>

      {produtos.length === 0 &&
        !erro && (
          <p
            className="texto-secundario mt-3"
            role="status"
          >
            {paginaInicial
              ? 'Ainda não existem produtos disponíveis.'
              : 'Nenhum produto encontrado com os filtros selecionados.'}
          </p>
        )}
    </>
  );
}