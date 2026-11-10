import {
  useEffect,
  useState
} from 'react';

import {
  Link,
  useParams
} from 'react-router-dom';

import {
  api,
  USAR_DADOS_SIMULADOS
} from '../api/client.js';

import {
  useAuth
} from '../context/AuthContext.jsx';

import {
  useCarrinho
} from '../context/CarrinhoContext.jsx';

import produtosSimulados
  from '../data/produtos.json';

const euro = (valor) =>
  Number(valor).toLocaleString(
    'pt-PT',
    {
      style: 'currency',
      currency: 'EUR'
    }
  );

export default function Produto() {
  const { id } = useParams();

  const [produto, setProduto] =
    useState(null);

  const [erro, setErro] =
    useState('');

  const [aCarregar, setACarregar] =
    useState(true);

  const { utilizador } = useAuth();

  const carrinho = useCarrinho();

  useEffect(() => {
    let ativo = true;

    setACarregar(true);
    setErro('');

    if (USAR_DADOS_SIMULADOS) {
      const encontrado =
        produtosSimulados.find(
          (item) =>
            item._id === id ||
            item.id === id
        );

      if (ativo) {
        setProduto(encontrado || null);

        if (!encontrado) {
          setErro(
            'Produto não encontrado.'
          );
        }

        setACarregar(false);
      }

      return () => {
        ativo = false;
      };
    }

    api(`/products/${id}`)
      .then((dados) => {
        if (!ativo) {
          return;
        }

        setProduto(dados);
        setErro('');
      })
      .catch((err) => {
        if (!ativo) {
          return;
        }

        setProduto(null);

        setErro(
          err.message ||
          'Não foi possível carregar o produto.'
        );
      })
      .finally(() => {
        if (ativo) {
          setACarregar(false);
        }
      });

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
        A carregar produto...
      </p>
    );
  }

  if (erro || !produto) {
    return (
      <div
        className="alert alert-danger"
        role="alert"
      >
        {erro || 'Produto não encontrado.'}
      </div>
    );
  }

  const produtor = produto.produtor;

  const produtorId =
    produtor?._id ||
    produtor?.id;

  const nomeProdutor =
    produtor?.produtor?.nomeExploracao ||
    produtor?.nome;

  const localidade =
    produtor?.produtor?.localidade;

  const semStock =
    produto.stock === 0;

  return (
    <article>
      <div className="mb-3">
        <Link
          to="/"
          className="link-secondary"
        >
          ← Voltar ao catálogo
        </Link>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-6">
          {produto.imagemUrl ? (
            <img
              src={produto.imagemUrl}
              alt={produto.nome}
              className="img-fluid rounded w-100"
            />
          ) : (
            <div
              className="cartao-produto__imagem rounded"
              aria-hidden="true"
            />
          )}
        </div>

        <div className="col-12 col-lg-6">
          {produto.biologico && (
            <span className="etiqueta-bio mb-2">
              BIO
            </span>
          )}

          <h1 className="mb-3">
            {produto.nome}
          </h1>

          <p className="preco fs-4">
            {euro(produto.preco)}{' '}
            <span className="texto-secundario fs-6">
              / {produto.unidade}
            </span>
          </p>

          {produto.descricao && (
            <p>
              {produto.descricao}
            </p>
          )}

          <dl className="row mt-4">
            <dt className="col-5">
              Categoria
            </dt>

            <dd className="col-7">
              {produto.categoria || '—'}
            </dd>

            <dt className="col-5">
              Stock
            </dt>

            <dd className="col-7">
              {produto.stock}{' '}
              {produto.unidade}
            </dd>

            <dt className="col-5">
              Biológico
            </dt>

            <dd className="col-7">
              {produto.biologico
                ? 'Sim'
                : 'Não'}
            </dd>

            {produto.epocas?.length > 0 && (
              <>
                <dt className="col-5">
                  Época
                </dt>

                <dd className="col-7">
                  {produto.epocas.join(', ')}
                </dd>
              </>
            )}
          </dl>

          {produtorId && (
            <div className="mt-4">
              <span className="texto-secundario">
                Produtor:{' '}
              </span>

              <Link
                to={`/produtores/${produtorId}`}
              >
                {nomeProdutor ||
                  'Ver produtor'}
              </Link>

              {localidade && (
                <span className="texto-secundario">
                  {' · '}
                  {localidade}
                </span>
              )}
            </div>
          )}

          {utilizador?.papel ===
            'comprador' && (
            <button
              type="button"
              className="btn btn-success mt-4"
              disabled={semStock}
              onClick={() =>
                carrinho.adicionar(
                  produto
                )
              }
            >
              {semStock
                ? 'Sem stock'
                : 'Adicionar ao carrinho'}
            </button>
          )}

          {!utilizador && (
            semStock ? (
              <button
                type="button"
                className="btn btn-secondary mt-4"
                disabled
              >
                Sem stock
              </button>
            ) : (
              <Link
                to="/login"
                className="btn btn-success mt-4"
              >
                Entrar para comprar
              </Link>
            )
          )}
        </div>
      </div>
    </article>
  );
}