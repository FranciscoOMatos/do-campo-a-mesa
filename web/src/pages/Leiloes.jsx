import {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  api
} from '../api/client.js';

import {
  useAuth
} from '../context/AuthContext.jsx';

import CartaoLeilao
  from '../components/CartaoLeilao.jsx';

const FILTROS = [
  {
    valor: 'todos',
    texto: 'Todos'
  },
  {
    valor: 'ativo',
    texto: 'Ao vivo'
  },
  {
    valor: 'agendado',
    texto: 'Agendados'
  },
  {
    valor: 'terminado',
    texto: 'Terminados'
  }
];

export default function Leiloes() {
  const { utilizador } =
    useAuth();

  const [leiloes, setLeiloes] =
    useState([]);

  const [filtro, setFiltro] =
    useState('todos');

  const [aCarregar, setACarregar] =
    useState(true);

  const [erro, setErro] =
    useState('');

  useEffect(() => {
    let ativo = true;

    setACarregar(true);

    api('/auctions')
      .then((dados) => {
        if (!ativo) {
          return;
        }

        setLeiloes(dados);
        setErro('');
      })
      .catch((err) => {
        if (!ativo) {
          return;
        }

        setErro(err.message);
      })
      .finally(() => {
        if (ativo) {
          setACarregar(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, []);

  const filtrados =
    useMemo(() => {
      const lista =
        filtro === 'todos'
          ? leiloes
          : leiloes.filter(
              (leilao) =>
                leilao.estado ===
                filtro
            );

      return [...lista].sort(
        (a, b) => {
          const ordem = {
            ativo: 0,
            agendado: 1,
            terminado: 2
          };

          const diferenca =
            (ordem[a.estado] ?? 3) -
            (ordem[b.estado] ?? 3);

          if (diferenca !== 0) {
            return diferenca;
          }

          return (
            new Date(a.iniciaEm) -
            new Date(b.iniciaEm)
          );
        }
      );
    }, [leiloes, filtro]);

  return (
    <>
      <header className="mb-4">
        <h1>Leilões</h1>

        <p className="texto-secundario mb-0">
          Acompanhe lotes de produtores
          locais e participe em leilões
          em tempo real.
        </p>
      </header>

      <section
        className="mb-4"
        aria-labelledby="filtros-leiloes"
      >
        <h2
          id="filtros-leiloes"
          className="visually-hidden"
        >
          Filtrar leilões
        </h2>

        <div
          className="d-flex flex-wrap gap-2"
          role="group"
          aria-label="Filtrar leilões por estado"
        >
          {FILTROS.map((opcao) => {
            const selecionado =
              filtro ===
              opcao.valor;

            return (
              <button
                key={opcao.valor}
                type="button"
                className={`btn btn-sm ${
                  selecionado
                    ? 'btn-dark'
                    : 'btn-outline-secondary'
                }`}
                aria-pressed={
                  selecionado
                }
                onClick={() =>
                  setFiltro(
                    opcao.valor
                  )
                }
              >
                {opcao.texto}
              </button>
            );
          })}
        </div>

        <p
          className="texto-secundario small mt-2 mb-0"
          role="status"
          aria-live="polite"
        >
          {filtrados.length}{' '}
          {filtrados.length === 1
            ? 'leilão encontrado'
            : 'leilões encontrados'}
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

      {aCarregar && (
        <div
          className="text-center py-5"
          role="status"
        >
          <div
            className="spinner-border"
            aria-hidden="true"
          />

          <p className="mt-2 mb-0">
            A carregar leilões...
          </p>
        </div>
      )}

      {!aCarregar &&
        !erro &&
        filtrados.length > 0 && (
          <section
            className="row g-4"
            aria-label="Lista de leilões"
          >
            {filtrados.map(
              (leilao) => (
                <div
                  key={leilao._id}
                  className="col-12 col-md-6 col-xl-4"
                >
                  <CartaoLeilao
                    leilao={leilao}
                    autenticado={
                      Boolean(
                        utilizador
                      )
                    }
                  />
                </div>
              )
            )}
          </section>
        )}

      {!aCarregar &&
        !erro &&
        filtrados.length === 0 && (
          <div
            className="text-center py-5"
            role="status"
          >
            <h2 className="h5">
              Nenhum leilão encontrado
            </h2>

            <p className="texto-secundario mb-0">
              Não existem leilões para
              este estado neste momento.
            </p>
          </div>
        )}
    </>
  );
}