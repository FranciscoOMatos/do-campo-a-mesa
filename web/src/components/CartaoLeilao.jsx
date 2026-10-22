import { Link } from 'react-router-dom';

const euro = (valor) =>
  Number(valor ?? 0).toLocaleString(
    'pt-PT',
    {
      style: 'currency',
      currency: 'EUR'
    }
  );

const formatarData = (data) => {
  if (!data) {
    return '—';
  }

  return new Date(data).toLocaleString(
    'pt-PT',
    {
      dateStyle: 'short',
      timeStyle: 'short'
    }
  );
};

const CLASSES_ESTADO = {
  ativo: 'text-bg-success',
  agendado: 'text-bg-warning',
  terminado: 'text-bg-secondary'
};

const NOMES_ESTADO = {
  ativo: 'Ao vivo',
  agendado: 'Agendado',
  terminado: 'Terminado'
};

export default function CartaoLeilao({
  leilao,
  autenticado
}) {
  const produtor =
    leilao.produtor;

  const produto =
    leilao.produto;

  const valorAtual =
    leilao.licitacaoAtual?.valor ??
    leilao.precoBase;

  const tituloValor =
    leilao.estado === 'agendado'
      ? 'Preço base'
      : leilao.estado === 'terminado'
        ? 'Valor final'
        : 'Licitação atual';

  return (
    <article className="card h-100 shadow-sm">
      {produto?.imagemUrl && (
        <img
          src={produto.imagemUrl}
          className="card-img-top"
          alt={produto.nome || leilao.lote}
          loading="lazy"
          style={{
            height: '12rem',
            objectFit: 'cover'
          }}
        />
      )}

      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <span
            className={`badge ${
              CLASSES_ESTADO[
                leilao.estado
              ] || 'text-bg-secondary'
            }`}
          >
            {NOMES_ESTADO[
              leilao.estado
            ] || leilao.estado}
          </span>

          <span className="text-secondary small">
            {leilao.numLicitacoes || 0}{' '}
            {leilao.numLicitacoes === 1
              ? 'licitação'
              : 'licitações'}
          </span>
        </div>

        <h2 className="h5 mb-1">
          {leilao.lote}
        </h2>

        {produto?.nome && (
          <p className="text-secondary small mb-1">
            Produto: {produto.nome}
          </p>
        )}

        {produtor?.nome && (
          <p className="text-secondary small mb-3">
            {produtor.nome}

            {produtor?.produtor
              ?.localidade && (
              <>
                {' · '}
                {
                  produtor.produtor
                    .localidade
                }
              </>
            )}
          </p>
        )}

        {leilao.quantidade && (
          <p className="mb-2">
            <strong>
              Quantidade:
            </strong>{' '}
            {leilao.quantidade}
          </p>
        )}

        <dl className="row small mb-3">
          <dt className="col-5">
            Início
          </dt>

          <dd className="col-7">
            {formatarData(
              leilao.iniciaEm
            )}
          </dd>

          <dt className="col-5">
            Fim
          </dt>

          <dd className="col-7">
            {formatarData(
              leilao.terminaEm
            )}
          </dd>
        </dl>

        <div className="mt-auto">
          <p className="text-secondary small mb-0">
            {tituloValor}
          </p>

          <p className="fs-4 fw-bold mb-3">
            {euro(valorAtual)}
          </p>

          {autenticado ? (
            <Link
              to={`/leiloes/${leilao._id}`}
              className="btn btn-success w-100"
            >
              {leilao.estado ===
              'ativo'
                ? 'Entrar na sala'
                : 'Ver leilão'}
            </Link>
          ) : (
            <Link
              to="/login"
              className="btn btn-outline-success w-100"
            >
              Iniciar sessão para ver
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}