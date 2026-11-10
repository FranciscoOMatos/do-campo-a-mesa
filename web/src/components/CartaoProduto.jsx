import { Link } from 'react-router-dom';

const euro = (valor) =>
  valor.toLocaleString('pt-PT', {
    style: 'currency',
    currency: 'EUR'
  });

export default function CartaoProduto({
  produto,
  onAdicionar
}) {
  const produtor = produto.produtor;

  const produtoId =
    produto._id ||
    produto.id;

  const produtorId =
    produtor?._id ||
    produtor?.id;

  const nomeProdutor =
    produtor?.produtor?.nomeExploracao ||
    produtor?.nome;

  const localidade =
    produtor?.produtor?.localidade;

  const temProdutor =
    produtorId &&
    (nomeProdutor || localidade);

  const semStock =
    produto.stock === 0;

  return (
    <article className="card cartao-produto h-100">
      {produto.imagemUrl ? (
        <Link
          to={`/produtos/${produtoId}`}
          aria-label={`Ver ${produto.nome}`}
        >
          <img
            src={produto.imagemUrl}
            className="card-img-top"
            alt={produto.nome}
            loading="lazy"
          />
        </Link>
      ) : (
        <div
          className="cartao-produto__imagem"
          aria-hidden="true"
        />
      )}

      <div className="card-body d-flex flex-column">
        {produto.biologico && (
          <span className="etiqueta-bio">
            BIO
          </span>
        )}

        <h3 className="h6 mb-1">
          <Link
            to={`/produtos/${produtoId}`}
            className="text-decoration-none text-reset"
          >
            {produto.nome}
          </Link>
        </h3>

        {temProdutor && (
          <p className="texto-secundario small mb-2">
            <Link
              to={`/produtores/${produtorId}`}
              className="link-secondary"
            >
              {nomeProdutor}

              {nomeProdutor &&
                localidade &&
                ' · '}

              {localidade}
            </Link>
          </p>
        )}

        <p className="preco mt-auto mb-2">
          {euro(produto.preco)}{' '}
          <span className="texto-secundario small">
            / {produto.unidade}
          </span>
        </p>

        {onAdicionar && (
          <button
            type="button"
            className="btn btn-success w-100"
            onClick={onAdicionar}
            disabled={semStock}
          >
            {semStock
              ? 'Sem stock'
              : 'Adicionar ao carrinho'}
          </button>
        )}
      </div>
    </article>
  );
}