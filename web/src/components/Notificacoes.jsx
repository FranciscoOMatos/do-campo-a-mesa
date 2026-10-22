import {
  useEffect,
  useRef,
  useState
} from 'react';

import {
  Link
} from 'react-router-dom';

import {
  useSocket
} from '../context/SocketContext.jsx';

const euro = (valor) =>
  Number(valor ?? 0).toLocaleString(
    'pt-PT',
    {
      style: 'currency',
      currency: 'EUR'
    }
  );

export default function Notificacoes() {
  const socket = useSocket();

  const [notificacoes, setNotificacoes] =
    useState([]);

  const contador =
    useRef(0);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const adicionar = ({
      tipo = 'info',
      titulo,
      mensagem,
      destino
    }) => {
      contador.current += 1;

      const id =
        contador.current;

      setNotificacoes(
        (atuais) => [
          ...atuais,
          {
            id,
            tipo,
            titulo,
            mensagem,
            destino
          }
        ].slice(-4)
      );

      setTimeout(() => {
        setNotificacoes(
          (atuais) =>
            atuais.filter(
              (item) =>
                item.id !== id
            )
        );
      }, 6000);
    };

    const onLeilaoGanho = (dados) => {
      adicionar({
        tipo: 'success',
        titulo: 'Leilão ganho',
        mensagem:
          `Ganhou "${dados.lote}" por ${euro(
            dados.valor
          )}.`,
        destino: '/encomendas'
      });
    };

    const onLeilaoTerminado = (dados) => {
      adicionar({
        tipo: 'info',
        titulo: 'Leilão terminado',
        mensagem:
          dados.vencedor
            ? `"${dados.lote}" terminou em ${euro(
                dados.valor
              )}.`
            : `"${dados.lote}" terminou sem licitações.`,
        destino: '/produtor'
      });
    };

    const onNovaEncomenda = () => {
      adicionar({
        tipo: 'success',
        titulo: 'Nova encomenda',
        mensagem:
          'Recebeu uma nova encomenda.',
        destino: '/produtor'
      });
    };

    const onEncomendaAtualizada = (
      dados
    ) => {
      adicionar({
        tipo: 'info',
        titulo:
          'Encomenda atualizada',
        mensagem:
          `O estado da encomenda passou para "${dados.estado}".`,
        destino: '/encomendas'
      });
    };

    const onContaValidada = () => {
      adicionar({
        tipo: 'success',
        titulo: 'Conta validada',
        mensagem:
          'A sua conta de produtor foi aprovada.'
      });
    };

    socket.on(
      'leilao-ganho',
      onLeilaoGanho
    );

    socket.on(
      'leilao-terminado',
      onLeilaoTerminado
    );

    socket.on(
      'nova-encomenda',
      onNovaEncomenda
    );

    socket.on(
      'encomenda-atualizada',
      onEncomendaAtualizada
    );

    socket.on(
      'conta-validada',
      onContaValidada
    );

    return () => {
      socket.off(
        'leilao-ganho',
        onLeilaoGanho
      );

      socket.off(
        'leilao-terminado',
        onLeilaoTerminado
      );

      socket.off(
        'nova-encomenda',
        onNovaEncomenda
      );

      socket.off(
        'encomenda-atualizada',
        onEncomendaAtualizada
      );

      socket.off(
        'conta-validada',
        onContaValidada
      );
    };
  }, [socket]);

  const fechar = (id) => {
    setNotificacoes(
      (atuais) =>
        atuais.filter(
          (item) =>
            item.id !== id
        )
    );
  };

  if (
    notificacoes.length === 0
  ) {
    return null;
  }

  return (
    <div
      className="position-fixed top-0 end-0 p-3 d-flex flex-column gap-2"
      style={{
        zIndex: 1080,
        width: 'min(24rem, 100%)',
        marginTop: '4rem'
      }}
      aria-live="polite"
      aria-atomic="false"
    >
      {notificacoes.map(
        (notificacao) => (
          <div
            key={
              notificacao.id
            }
            className={`alert alert-${notificacao.tipo} shadow mb-0`}
            role="status"
          >
            <div className="d-flex justify-content-between gap-3">
              <div>
                <strong className="d-block mb-1">
                  {
                    notificacao.titulo
                  }
                </strong>

                <span>
                  {
                    notificacao.mensagem
                  }
                </span>

                {notificacao.destino && (
                  <div className="mt-2">
                    <Link
                      to={
                        notificacao.destino
                      }
                      className="alert-link"
                      onClick={() =>
                        fechar(
                          notificacao.id
                        )
                      }
                    >
                      Ver detalhes
                    </Link>
                  </div>
                )}
              </div>

              <button
                type="button"
                className="btn-close"
                aria-label="Fechar notificação"
                onClick={() =>
                  fechar(
                    notificacao.id
                  )
                }
              />
            </div>
          </div>
        )
      )}
    </div>
  );
}