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
];

export default function Catalogo() {
  const [produtos, setProdutos] = useState([]);
  const [filtro, setFiltro] = useState({
    q: '',
    categoria: 'Todos',
    bio: false,
  });
  const [erro, setErro] = useState('');

  const carrinho = useCarrinho();
  const { utilizador } = useAuth();

  useEffect(() => {
    if (USAR_DADOS_SIMULADOS) {
      // Semana 2: filtragem local sobre dados simulados
      const filtrados = produtosSimulados.filter(
        (produto) =>
          (filtro.categoria === 'Todos' ||
            produto.categoria === filtro.categoria) &&
          (!filtro.bio || produto.biologico) &&
          produto.nome.toLowerCase().includes(filtro.q.toLowerCase()),
      );

      setProdutos(filtrados);
      setErro('');
      return;
    }

    const parametros = new URLSearchParams();

    if (filtro.q) {
      parametros.set('q', filtro.q);
    }

    if (filtro.categoria !== 'Todos') {
      parametros.set('categoria', filtro.categoria);
    }

    if (filtro.bio) {
      parametros.set('bio', 'true');
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
        className="filtros mb-3"
        aria-labelledby="titulo-filtros"
      >
        <h2
          id="titulo-filtros"
          className="visually-hidden"
        >
          Filtrar produtos
        </h2>

        <div className="flex-grow-1">
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

        <div className="form-check">
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

        {/* TODO: filtros por época, preço máximo e ordenação */}
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

      {produtos.length === 0 && (
        <p
          className="texto-secundario mt-3"
          role="status"
        >
          Nenhum produto encontrado.
        </p>
      )}
    </>
  );
}