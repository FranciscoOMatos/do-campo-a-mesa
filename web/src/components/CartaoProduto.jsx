// Componente reutilizável: cartão de produto do catálogo
const euro = (valor) =>
  valor.toLocaleString('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  });

export default function CartaoProduto({
  produto,
  onAdicionar,
}) {
  const produtor = produto.produtor;

  const temProdutor =
    produtor?.nome ||
    produtor?.produtor?.localidade;

  const semStock = produto.stock === 0;

  return (
    <article className="card cartao-produto h-100">
      {produto.imagemUrl ? (
        <img
          src={produto.imagemUrl}
          className="card-img-top"
          alt={produto.nome}
          loading="lazy"
        />
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
          {produto.nome}
        </h3>

        {temProdutor && (
          <p className="texto-secundario small mb-2">
            {produtor?.nome}

            {produtor?.nome &&
              produtor?.produtor?.localidade &&
              ' · '}

            {produtor?.produtor?.localidade}
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