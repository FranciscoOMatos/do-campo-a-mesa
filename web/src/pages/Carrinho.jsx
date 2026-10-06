import { useCarrinho } from '../context/CarrinhoContext.jsx';
import PorImplementar from '../components/PorImplementar.jsx';

const euro = (valor) =>
  valor.toLocaleString('pt-PT', {
    style: 'currency',
    currency: 'EUR'
  });

export default function Carrinho() {
  const {
    linhas,
    alterarQuantidade,
    remover,
    esvaziar,
    total
  } = useCarrinho();

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0">Carrinho</h1>

        {linhas.length > 0 && (
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={esvaziar}
          >
            Esvaziar carrinho
          </button>
        )}
      </div>

      {linhas.length === 0 ? (
        <p>O carrinho está vazio.</p>
      ) : (
        <div className="list-group mb-4">
          {linhas.map(({ produto, quantidade }) => {
            const subtotal =
              produto.preco * quantidade;

            return (
              <article
                key={produto._id}
                className="list-group-item"
              >
                <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
                  <div>
                    <h2 className="h5 mb-1">
                      {produto.nome}
                    </h2>

                    <p className="texto-secundario mb-1">
                      {euro(produto.preco)} /{' '}
                      {produto.unidade}
                    </p>

                    <p className="fw-bold mb-0">
                      Subtotal: {euro(subtotal)}
                    </p>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      aria-label={`Diminuir quantidade de ${produto.nome}`}
                      onClick={() =>
                        alterarQuantidade(
                          produto._id,
                          quantidade - 1
                        )
                      }
                    >
                      −
                    </button>

                    <span
                      className="px-2"
                      aria-label={`Quantidade: ${quantidade}`}
                    >
                      {quantidade}
                    </span>

                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      aria-label={`Aumentar quantidade de ${produto.nome}`}
                      onClick={() =>
                        alterarQuantidade(
                          produto._id,
                          quantidade + 1
                        )
                      }
                    >
                      +
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-danger ms-2"
                      onClick={() =>
                        remover(produto._id)
                      }
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="fs-5 fw-bold">
        Total: {euro(total)}
      </p>

      {linhas.length > 0 && (
        <PorImplementar passo={3}>
          escolher levantamento ou entrega e submeter
          com <code>POST /api/orders</code> (uma encomenda
          por produtor).
        </PorImplementar>
      )}
    </>
  );
}