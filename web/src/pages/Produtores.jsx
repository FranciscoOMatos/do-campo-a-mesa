import {
  useEffect,
  useState
} from 'react';

import {
  Link
} from 'react-router-dom';

import {
  api
} from '../api/client.js';

export default function Produtores() {
  const [
    produtores,
    setProdutores
  ] = useState([]);

  const [
    aCarregar,
    setACarregar
  ] = useState(true);

  const [
    erro,
    setErro
  ] = useState('');

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        setACarregar(true);

        const dados = await api(
          '/producers'
        );

        if (!ativo) {
          return;
        }

        setProdutores(dados);
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
  }, []);

  return (
    <>
      <section className="mb-4">
        <h1 className="mb-2">
          Produtores
        </h1>

        <p className="texto-secundario mb-0">
          Conheça os produtores locais e descubra
          os produtos disponíveis em cada exploração.
        </p>
      </section>

      {aCarregar && (
        <p
          className="texto-secundario"
          role="status"
        >
          A carregar produtores...
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
        produtores.length === 0 && (
          <p className="texto-secundario">
            Não existem produtores disponíveis
            neste momento.
          </p>
        )}

      {!aCarregar &&
        !erro &&
        produtores.length > 0 && (
          <section
            className="row g-4"
            aria-label="Lista de produtores"
          >
            {produtores.map(
              (utilizador) => {
                const perfil =
                  utilizador.produtor;

                const nome =
                  perfil.nomeExploracao ||
                  utilizador.nome;

                return (
                  <div
                    key={utilizador.id}
                    className="col-12 col-md-6 col-lg-4"
                  >
                    <article className="card h-100 p-4">
                      <p className="texto-secundario small mb-2">
                        Produtor local
                      </p>

                      <h2 className="h4 mb-2">
                        {nome}
                      </h2>

                      {perfil.localidade && (
                        <p className="mb-3">
                          <strong>
                            Localidade:
                          </strong>{' '}
                          {perfil.localidade}
                        </p>
                      )}

                      {perfil.descricao ? (
                        <p className="texto-secundario">
                          {perfil.descricao}
                        </p>
                      ) : (
                        <p className="texto-secundario">
                          Produtor local com produtos
                          disponíveis na plataforma.
                        </p>
                      )}

                      <div className="mt-auto">
                        <Link
                          to={`/produtores/${utilizador.id}`}
                          className="btn btn-outline-success"
                        >
                          Ver produtor
                        </Link>
                      </div>
                    </article>
                  </div>
                );
              }
            )}
          </section>
        )}
    </>
  );
}