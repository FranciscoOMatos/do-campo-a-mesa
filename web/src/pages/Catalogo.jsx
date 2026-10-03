// Visitante: catálogo com pesquisa e filtros
import { useEffect, useState } from 'react';
import CartaoProduto from '../components/CartaoProduto.jsx';
import { useCarrinho } from '../context/CarrinhoContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api, USAR_DADOS_SIMULADOS } from '../api/client.js';
import produtosSimulados from '../data/produtos.json';

const CATEGORIAS = [
  'Todos',
  'Hortícolas',
  'Fruta',
  'Mel',
  'Vinho',
  'Queijo',
  'Padaria',
  'Outros',
];

const EPOCAS = [
  'Todas',
  'Primavera',
  'Verão',
  'Outono',
  'Inverno',
];

const ORDENACOES = [
  { valor: 'recentes', texto: 'Mais recentes' },
  { valor: 'preco_asc', texto: 'Preço: menor para maior' },
  { valor: 'preco_desc', texto: 'Preço: maior para menor' },
];

const FILTRO_INICIAL = {
  q: '',
  categoria: 'Todos',
  bio: false,
  epoca: 'Todas',
  precoMax: '',
  ordenar: 'recentes',
};

export default function Catalogo() {
  const [produtos, setProdutos] = useState([]);
  const [filtro, setFiltro] = useState(FILTRO_INICIAL);
  const [erro, setErro] = useState('');

  const carrinho = useCarrinho();
  const { utilizador } = useAuth();

  useEffect(() => {
    if (USAR_DADOS_SIMULADOS) {
      let filtrados = produtosSimulados.filter((produto) => {
        const correspondePesquisa = produto.nome
          .toLowerCase()
          .includes(filtro.q.trim().toLowerCase());

        const correspondeCategoria =
          filtro.categoria === 'Todos' ||
          produto.categoria === filtro.categoria;

        const correspondeBiologico =
          !filtro.bio || produto.biologico;

        const correspondeEpoca =
          filtro.epoca === 'Todas' ||
          produto.epocas?.includes(filtro.epoca);

        const correspondePreco =
          filtro.precoMax === '' ||
          produto.preco <= Number(filtro.precoMax);

        return (
          correspondePesquisa &&
          correspondeCategoria &&
          correspondeBiologico &&
          correspondeEpoca &&
          correspondePreco
        );
      });

      if (filtro.ordenar === 'preco_asc') {
        filtrados = [...filtrados].sort(
          (a, b) => a.preco - b.preco,
        );
      }

      if (filtro.ordenar === 'preco_desc') {
        filtrados = [...filtrados].sort(
          (a, b) => b.preco - a.preco,
        );
      }

      setProdutos(filtrados);
      setErro('');
      return;
    }

    const parametros = new URLSearchParams();

    if (filtro.q.trim()) {
      parametros.set('q', filtro.q.trim());
    }

    if (filtro.categoria !== 'Todos') {
      parametros.set('categoria', filtro.categoria);
    }

    if (filtro.precoMax !== '') {
      parametros.set('precoMax', filtro.precoMax);
    }

    if (filtro.bio) {
      parametros.set('bio', 'true');
    }

    if (filtro.epoca !== 'Todas') {
      parametros.set('epoca', filtro.epoca);
    }

    if (filtro.ordenar) {
      parametros.set('ordenar', filtro.ordenar);
    }

    api(`/products?${parametros.toString()}`)
      .then((dados) => {
        setProdutos(dados);
        setErro('');
      })
      .catch((e) => {
        setErro(e.message);
      });
  }, [filtro]);

  const mudar = (campo) => (e) => {
    const valor =
      e.target.type === 'checkbox'
        ? e.target.checked
        : e.target.value;

    setFiltro((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  };

  const limparFiltros = () => {
    setFiltro(FILTRO_INICIAL);
  };

  return (
    <>
      <section className="destaque mb-4">
        <h1>Direto de quem produz, para a sua mesa.</h1>

        <p className="texto-secundario">
          Produtores do Alto Minho. Encomende ou dispute os lotes
          da época nos leilões em direto.
        </p>

        {/* TODO: cartão com o leilão em direto em destaque */}
      </section>

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
            Pesquisar produtos
          </label>

          <input
            id="pesquisa"
            type="search"
            className="form-control"
            placeholder="Pesquisar kiwi, mel, Alvarinho…"
            value={filtro.q}
            onChange={mudar('q')}
          />
        </div>

        <div
          className="d-flex flex-wrap gap-2"
          role="group"
          aria-label="Filtrar por categoria"
        >
          {CATEGORIAS.map((categoria) => {
            const selecionada =
              filtro.categoria === categoria;

            return (
              <button
                key={categoria}
                type="button"
                className={`btn btn-sm ${
                  selecionada
                    ? 'btn-dark'
                    : 'btn-outline-secondary'
                }`}
                aria-pressed={selecionada}
                onClick={() =>
                  setFiltro((atual) => ({
                    ...atual,
                    categoria,
                  }))
                }
              >
                {categoria}
              </button>
            );
          })}
        </div>

        <div className="row g-2 w-100 align-items-end">
          <div className="col-12 col-md-4">
            <label
              htmlFor="epoca"
              className="form-label"
            >
              Época
            </label>

            <select
              id="epoca"
              className="form-select"
              value={filtro.epoca}
              onChange={mudar('epoca')}
            >
              {EPOCAS.map((epoca) => (
                <option
                  key={epoca}
                  value={epoca}
                >
                  {epoca}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-4">
            <label
              htmlFor="precoMax"
              className="form-label"
            >
              Preço máximo
            </label>

            <div className="input-group">
              <span className="input-group-text">€</span>

              <input
                id="precoMax"
                type="number"
                className="form-control"
                min="0"
                step="0.01"
                placeholder="Sem limite"
                value={filtro.precoMax}
                onChange={mudar('precoMax')}
              />
            </div>
          </div>

          <div className="col-12 col-md-4">
            <label
              htmlFor="ordenar"
              className="form-label"
            >
              Ordenar
            </label>

            <select
              id="ordenar"
              className="form-select"
              value={filtro.ordenar}
              onChange={mudar('ordenar')}
            >
              {ORDENACOES.map((opcao) => (
                <option
                  key={opcao.valor}
                  value={opcao.valor}
                >
                  {opcao.texto}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-3 w-100">
          <div className="form-check mb-0">
            <input
              id="bio"
              className="form-check-input"
              type="checkbox"
              checked={filtro.bio}
              onChange={mudar('bio')}
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
            onClick={limparFiltros}
          >
            Limpar filtros
          </button>
        </div>

        {/* Número de resultados também dá feedback imediato ao utilizador */}
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

        {produtos.map((produto) => (
          <CartaoProduto
            key={produto._id}
            produto={produto}
            onAdicionar={
              utilizador?.papel === 'comprador'
                ? () => carrinho.adicionar(produto)
                : undefined
            }
          />
        ))}
      </section>

      {produtos.length === 0 && !erro && (
        <p
          className="texto-secundario mt-3"
          role="status"
        >
          Nenhum produto encontrado com os filtros selecionados.
        </p>
      )}
    </>
  );
}