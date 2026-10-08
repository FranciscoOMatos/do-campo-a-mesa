import {
  useEffect,
  useState
} from 'react';

import EstadoEncomenda from '../components/EstadoEncomenda.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';

const euro = (valor) =>
  Number(valor).toLocaleString('pt-PT', {
    style: 'currency',
    currency: 'EUR'
  });

function formatarData(valor) {
  if (!valor) {
    return '';
  }

  return new Intl.DateTimeFormat(
    'pt-PT',
    {
      dateStyle: 'medium',
      timeStyle: 'short'
    }
  ).format(new Date(valor));
}

function referencia(id) {
  return id
    ? id.slice(-6).toUpperCase()
    : '';
}

export default function Encomendas() {
  const { token } = useAuth();

  const [encomendas, setEncomendas] =
    useState([]);

  const [aCarregar, setACarregar] =
    useState(true);

  const [erro, setErro] =
    useState('');

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        setACarregar(true);

        const dados = await api(
          '/orders',
          {
            token
          }
        );

        if (!ativo) {
          return;
        }

        setEncomendas(dados);
        setErro('');
      } catch (err) {
        if (!ativo) {
          return;
        }

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
  }, [token]);

  return (
    <>
      <h1 className="mb-4">
        Encomendas
      </h1>

      {aCarregar && (
        <p
          className="texto-secundario"
          role="status"
        >
          A carregar encomendas...
        </p>
      )}

      {erro && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          {erro}
        </div>
      )}

      {!aCarregar &&
        !erro &&
        encomendas.length === 0 && (
          <p>
            Ainda não tem encomendas.
          </p>
        )}

      {!aCarregar &&
        !erro &&
        encomendas.map((encomenda) => {
          const produtor =
            encomenda.produtor
              ?.produtor
              ?.nomeExploracao ||
            encomenda.produtor?.nome ||
            'Produtor';

          const levantamento =
            encomenda.entrega?.tipo ===
            'levantamento';

          return (
            <article
              key={encomenda._id}
              className="card p-3 mb-3"
            >
              <div className="d-flex flex-column flex-md-row justify-content-between gap-2 mb-3">
                <div>
                  <h2 className="h5 mb-1">
                    Encomenda #
                    {referencia(
                      encomenda._id
                    )}
                  </h2>

                  <p className="mb-0">
                    {produtor}
                  </p>
                </div>

                <time
                  className="texto-secundario"
                  dateTime={
                    encomenda.createdAt
                  }
                >
                  {formatarData(
                    encomenda.createdAt
                  )}
                </time>
              </div>

              <EstadoEncomenda
                estado={encomenda.estado}
              />

              <ul className="list-group list-group-flush my-3">
                {encomenda.linhas.map(
                  (linha) => (
                    <li
                      key={linha._id}
                      className="list-group-item px-0 d-flex justify-content-between gap-3"
                    >
                      <span>
                        {linha.quantidade}
                        {' × '}
                        {linha.nome}
                      </span>

                      <span className="fw-semibold">
                        {euro(
                          linha.precoUnit *
                            linha.quantidade
                        )}
                      </span>
                    </li>
                  )
                )}
              </ul>

              <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
                <div>
                  <p className="mb-1">
                    <strong>
                      Entrega:
                    </strong>{' '}
                    {levantamento
                      ? 'Levantamento no produtor'
                      : 'Entrega ao domicílio'}
                  </p>

                  {!levantamento &&
                    encomenda.entrega
                      ?.morada && (
                      <p className="texto-secundario mb-0">
                        {
                          encomenda
                            .entrega
                            .morada
                        }
                      </p>
                    )}
                </div>

                <p className="fs-5 fw-bold mb-0">
                  Total:{' '}
                  {euro(
                    encomenda.total
                  )}
                </p>
              </div>
            </article>
          );
        })}
    </>
  );
}