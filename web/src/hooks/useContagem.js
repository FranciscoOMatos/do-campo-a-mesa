import {
  useEffect,
  useState
} from 'react';

export function useContagem(
  ate,
  offset = 0
) {
  const calcular = () => {
    if (!ate) {
      return 0;
    }

    const fim =
      new Date(ate).getTime();

    const agora =
      Date.now() + offset;

    return Math.max(
      0,
      fim - agora
    );
  };

  const [restante, setRestante] =
    useState(calcular);

  useEffect(() => {
    setRestante(calcular());

    const intervalo =
      setInterval(() => {
        setRestante(
          calcular()
        );
      }, 1000);

    return () => {
      clearInterval(
        intervalo
      );
    };
  }, [ate, offset]);

  return restante;
}

export function formatarTempo(ms) {
  const segundos =
    Math.floor(ms / 1000);

  const horas =
    Math.floor(
      segundos / 3600
    );

  const minutos =
    Math.floor(
      (segundos % 3600) / 60
    );

  const segundosRestantes =
    String(
      segundos % 60
    ).padStart(2, '0');

  if (horas > 0) {
    return `${
      horas
    }:${String(
      minutos
    ).padStart(
      2,
      '0'
    )}:${segundosRestantes}`;
  }

  return `${String(
    minutos
  ).padStart(
    2,
    '0'
  )}:${segundosRestantes}`;
}