import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useCarrinho } from '../context/CarrinhoContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';

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

  const { token } = useAuth();

  const [tipoEntrega, setTipoEntrega] =
    useState('levantamento');

  const [morada, setMorada] =
    useState('');

  const [aSubmeter, setASubmeter] =
    useState(false);

  const [erro, setErro] =
    useState('');

  const [sucesso, setSucesso] =
    useState('');

  async function finalizarEncomenda(e) {
    e.preventDefault();

    setErro('');
    setSucesso('');

    if (linhas.length === 0) {
      setErro('O carrinho está vazio.');
      return;
    }

    if (
      tipoEntrega === 'entrega' &&
      !morada.trim()
    ) {
      setErro(
        'Indique a morada para entrega.'
      );
      return;
    }

    const corpo = {
      linhas: linhas.map(
        ({ produto, quantidade }) => ({
          produto: produto._id,
          quantidade
        })
      ),

      entrega: {
        tipo: tipoEntrega,

        ...(tipoEntrega === 'entrega'
          ? {
              morada: morada.trim()
            }
          : {})
      }
    };

    try {
      setASubmeter(true);

      const encomendasCriadas =
        await api('/orders', {
          metodo: 'POST',
          corpo,
          token
        });

      esvaziar();
      setMorada('');
      setTipoEntrega('levantamento');

      const quantidade =
        encomendasCriadas.length;

      setSucesso(
        quantidade === 1
          ? 'Encomenda criada com sucesso.'
          : `${quantidade} encomendas criadas com sucesso.`
      );
    } catch (err) {
      setErro(err.message);
    } finally {
      setASubmeter(false);
    }
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0">
          Carrinho
        </h1>

        {linhas.length > 0 && (
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={esvaziar}
            disabled={aSubmeter}
          >
            Esvaziar carrinho
          </button>
        )}
      </div>

      {sucesso && (
        <div
          className="alert alert-success"
          role="status"
        >
          {sucesso}{' '}

          <Link
            to="/encomendas"
            className="alert-link"
          >
            Ver encomendas
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

      {linhas.length === 0 ? (
        <p>O carrinho está vazio.</p>
      ) : (
        <>
          <div className="list-group mb-4">
            {linhas.map(
              ({ produto, quantidade }) => {
                const subtotal =
                  produto.preco *
                  quantidade;

                const atingiuStock =
                  Number.isFinite(produto.stock) &&
                  quantidade >= produto.stock;

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
                          {euro(produto.preco)}
                          {' / '}
                          {produto.unidade}
                        </p>

                        <p className="fw-bold mb-0">
                          Subtotal:{' '}
                          {euro(subtotal)}
                        </p>
                      </div>

                      <div className="d-flex flex-wrap align-items-center gap-2">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          aria-label={`Diminuir quantidade de ${produto.nome}`}
                          disabled={aSubmeter}
                          onClick={() =>
                            alterarQuantidade(
                              produto._id,
                              quantidade - 1
                            )
                          }
                        >
                          −
                        </button>

                        <span className="px-2">
                          <span className="visually-hidden">
                            Quantidade:{' '}
                          </span>

                          {quantidade}
                        </span>

                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          aria-label={`Aumentar quantidade de ${produto.nome}`}
                          disabled={
                            aSubmeter ||
                            atingiuStock
                          }
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
                          className="btn btn-outline-danger ms-md-2"
                          disabled={aSubmeter}
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
              }
            )}
          </div>

          <p className="fs-5 fw-bold">
            Total: {euro(total)}
          </p>

          <form
            className="card p-3"
            onSubmit={finalizarEncomenda}
          >
            <fieldset disabled={aSubmeter}>
              <legend className="h5">
                Entrega
              </legend>

              <div className="form-check mb-2">
                <input
                  id="levantamento"
                  type="radio"
                  name="tipoEntrega"
                  className="form-check-input"
                  value="levantamento"
                  checked={
                    tipoEntrega ===
                    'levantamento'
                  }
                  onChange={(e) =>
                    setTipoEntrega(
                      e.target.value
                    )
                  }
                />

                <label
                  className="form-check-label"
                  htmlFor="levantamento"
                >
                  Levantamento no produtor
                </label>
              </div>

              <div className="form-check mb-3">
                <input
                  id="entrega"
                  type="radio"
                  name="tipoEntrega"
                  className="form-check-input"
                  value="entrega"
                  checked={
                    tipoEntrega ===
                    'entrega'
                  }
                  onChange={(e) =>
                    setTipoEntrega(
                      e.target.value
                    )
                  }
                />

                <label
                  className="form-check-label"
                  htmlFor="entrega"
                >
                  Entrega ao domicílio
                </label>
              </div>

              {tipoEntrega === 'entrega' && (
                <div className="mb-3">
                  <label
                    htmlFor="morada"
                    className="form-label"
                  >
                    Morada de entrega
                  </label>

                  <textarea
                    id="morada"
                    className="form-control"
                    rows="3"
                    value={morada}
                    onChange={(e) =>
                      setMorada(
                        e.target.value
                      )
                    }
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                className="btn btn-success"
              >
                {aSubmeter
                  ? 'A criar encomenda...'
                  : 'Finalizar encomenda'}
              </button>
            </fieldset>
          </form>
        </>
      )}
    </>
  );
}