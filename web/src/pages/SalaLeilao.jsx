import { useState } from 'react';
import { useParams } from 'react-router-dom';

import {
  useAuth
} from '../context/AuthContext.jsx';

import {
  useLeilao
} from '../hooks/useLeilao.js';

export default function SalaLeilao() {
  const { id } = useParams();

  const {
    utilizador
  } = useAuth();

  const {
    leilao,
    atual,
    licitacoes,
    participantes,
    erro,
    licitar
  } = useLeilao(id);

  const [valor, setValor] =
    useState('');

  const podeLicitar =
    utilizador?.papel === 'comprador' &&
    leilao?.estado === 'ativo';

  const submeterLicitacao = (e) => {
    e.preventDefault();

    const numero =
      Number(valor);

    if (
      !Number.isFinite(numero) ||
      numero <= 0
    ) {
      return;
    }

    licitar(numero);
    setValor('');
  };

  if (!leilao) {
    return (
      <div
        className="text-center py-5"
        aria-live="polite"
      >
        <p className="mb-0">
          A carregar leilão...
        </p>

        {erro && (
          <div
            className="alert alert-warning mt-3"
            role="alert"
          >
            {erro}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="sala-leilao">
      <section>
        <div className="mb-4">
          <span
            className={`badge ${
              leilao.estado === 'ativo'
                ? 'text-bg-success'
                : leilao.estado === 'agendado'
                  ? 'text-bg-warning'
                  : 'text-bg-secondary'
            }`}
          >
            {leilao.estado}
          </span>

          <h1 className="mt-2">
            {leilao.lote}
          </h1>

          {leilao.descricao && (
            <p className="lead">
              {leilao.descricao}
            </p>
          )}

          {leilao.quantidade && (
            <p>
              <strong>
                Quantidade:
              </strong>{' '}
              {leilao.quantidade}
            </p>
          )}

          <p className="text-secondary">
            {participantes}{' '}
            {participantes === 1
              ? 'pessoa a assistir'
              : 'pessoas a assistir'}
          </p>
        </div>

        <section
          aria-labelledby="historico-titulo"
        >
          <h2
            id="historico-titulo"
            className="h4"
          >
            Histórico de licitações
          </h2>

          {licitacoes.length === 0 ? (
            <p className="text-secondary">
              Ainda não existem licitações.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th scope="col">
                      Utilizador
                    </th>

                    <th scope="col">
                      Valor
                    </th>

                    <th scope="col">
                      Data
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {licitacoes.map(
                    (licitacao) => (
                      <tr
                        key={
                          licitacao._id
                        }
                      >
                        <td>
                          {
                            licitacao.nome
                          }
                        </td>

                        <td>
                          {Number(
                            licitacao.valor
                          ).toFixed(2)}{' '}
                          €
                        </td>

                        <td>
                          {new Date(
                            licitacao.createdAt
                          ).toLocaleString(
                            'pt-PT'
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>

      <aside className="card p-3">
        <p className="text-secondary small mb-1">
          Licitação atual
        </p>

        <p className="valor-atual">
          {atual?.valor != null
            ? `${Number(
                atual.valor
              ).toFixed(2)} €`
            : '—'}
        </p>

        <p className="small mb-3">
          Incremento mínimo:{' '}
          <strong>
            {Number(
              leilao.incremento
            ).toFixed(2)}{' '}
            €
          </strong>
        </p>

        {podeLicitar ? (
          <form
            onSubmit={
              submeterLicitacao
            }
          >
            <label
              htmlFor="valor"
              className="form-label"
            >
              O seu valor (€)
            </label>

            <input
              id="valor"
              type="number"
              step="0.01"
              min="0.01"
              className="form-control mb-2"
              value={valor}
              onChange={(e) =>
                setValor(
                  e.target.value
                )
              }
              required
            />

            <button
              type="submit"
              className="btn btn-success w-100"
            >
              Licitar
            </button>
          </form>
        ) : (
          <div
            className="alert alert-secondary mb-0"
          >
            {leilao.estado ===
            'terminado'
              ? 'Este leilão já terminou.'
              : leilao.estado ===
                  'agendado'
                ? 'O leilão ainda não começou.'
                : 'Apenas compradores podem licitar.'}
          </div>
        )}

        {erro && (
          <div
            className="alert alert-warning mt-2 mb-0"
            role="alert"
          >
            {erro}
          </div>
        )}
      </aside>
    </div>
  );
}