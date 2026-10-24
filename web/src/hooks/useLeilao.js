import {
  useCallback,
  useEffect,
  useState
} from 'react';

import {
  useSocket
} from '../context/SocketContext.jsx';

export function useLeilao(id) {
  const socket = useSocket();

  const [leilao, setLeilao] =
    useState(null);

  const [licitacoes, setLicitacoes] =
    useState([]);

  const [participantes, setParticipantes] =
    useState(0);

  const [erro, setErro] =
    useState('');

  const [offset, setOffset] =
  useState(0);

  useEffect(() => {
    if (!socket || !id) {
      return undefined;
    }

    const entrar = () => {
      socket.emit(
        'entrar',
        id
      );
    };

    const onEstado = (dados) => {
      setOffset(
  new Date(
    dados.agora
  ).getTime() -
  Date.now()
);

      setLeilao(
        dados.leilao
      );

      setLicitacoes(
        dados.licitacoes || []
      );

      setErro('');
    };

    const onNovaLicitacao = (dados) => {
      setLeilao((atual) => {
        if (!atual) {
          return atual;
        }

        return {
          ...atual,

          licitacaoAtual: {
            valor: dados.valor,
            comprador:
              dados.comprador,
            nome:
              dados.nome,
            em:
              dados.createdAt
          },

          numLicitacoes:
            dados.numLicitacoes
        };
      });

      setLicitacoes((atuais) => [
        dados,
        ...atuais
      ].slice(0, 20));
    };

    const onPresenca = (numero) => {
      setParticipantes(numero);
    };

    const onRecusada = (mensagem) => {
      setErro(mensagem);
    };

    const onAberto = () => {
  entrar();
};

    const onTerminado = (dados) => {
      setLeilao((atual) => (
        atual
          ? {
              ...atual,
              estado: 'terminado',
              encomenda:
                dados.encomenda
          }
          : atual
      ));
    };

    const onErroLigacao = (err) => {
      setErro(
        err.message ||
        'Erro na ligação ao servidor'
      );
    };

    socket.on(
      'connect',
      entrar
    );

    socket.on(
      'estado',
      onEstado
    );

    socket.on(
      'nova-licitacao',
      onNovaLicitacao
    );

    socket.on(
      'presenca',
      onPresenca
    );

    socket.on(
      'recusada',
      onRecusada
    );

    socket.on(
      'aberto',
      onAberto
    );

    socket.on(
      'terminado',
      onTerminado
    );

    socket.on(
      'connect_error',
      onErroLigacao
    );

    if (socket.connected) {
      entrar();
    }

    return () => {
      socket.emit(
        'sair',
        id
      );

      socket.off(
        'connect',
        entrar
      );

      socket.off(
        'estado',
        onEstado
      );

      socket.off(
        'nova-licitacao',
        onNovaLicitacao
      );

      socket.off(
        'presenca',
        onPresenca
      );

      socket.off(
        'recusada',
        onRecusada
      );

      socket.off(
        'aberto',
        onAberto
      );

      socket.off(
        'terminado',
        onTerminado
      );

      socket.off(
        'connect_error',
        onErroLigacao
      );
    };
  }, [socket, id]);

  const licitar = useCallback(
    (valor) => {
      setErro('');

      if (!socket) {
        setErro(
          'Sem ligação ao servidor'
        );

        return;
      }

      socket.emit(
        'licitar',
        {
          leilaoId: id,
          valor
        },
        (resposta) => {
          if (!resposta?.ok) {
            setErro(
              resposta?.erro ||
              'Não foi possível licitar'
            );
          }
        }
      );
    },
    [socket, id]
  );

  return {
    leilao,
    atual:
      leilao?.licitacaoAtual ||
      null,
    licitacoes,
    participantes,
    erro,
    offset,
    licitar
  };
}