// Estado global do carrinho
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

const CarrinhoContext = createContext(null);

function lerCarrinho() {
  try {
    const guardado = localStorage.getItem('carrinho');

    return guardado
      ? JSON.parse(guardado)
      : [];
  } catch {
    return [];
  }
}

export function CarrinhoProvider({ children }) {
  const [linhas, setLinhas] = useState(lerCarrinho);

  // Mantém o carrinho entre refreshes da página.
  useEffect(() => {
    try {
      localStorage.setItem(
        'carrinho',
        JSON.stringify(linhas)
      );
    } catch {
      // A aplicação continua a funcionar mesmo
      // que o armazenamento do browser não esteja disponível.
    }
  }, [linhas]);

  function adicionar(produto, quantidade = 1) {
    setLinhas((atual) => {
      const existe = atual.find(
        (linha) =>
          linha.produto._id === produto._id
      );

      if (existe) {
        return atual.map((linha) =>
          linha.produto._id === produto._id
            ? {
                ...linha,
                quantidade:
                  linha.quantidade + quantidade
              }
            : linha
        );
      }

      return [
        ...atual,
        {
          produto,
          quantidade
        }
      ];
    });
  }

  function alterarQuantidade(
    produtoId,
    quantidade
  ) {
    setLinhas((atual) => {
      if (quantidade < 1) {
        return atual.filter(
          (linha) =>
            linha.produto._id !== produtoId
        );
      }

      return atual.map((linha) =>
        linha.produto._id === produtoId
          ? {
              ...linha,
              quantidade
            }
          : linha
      );
    });
  }

  function remover(produtoId) {
    alterarQuantidade(produtoId, 0);
  }

  function esvaziar() {
    setLinhas([]);
  }

  const total = useMemo(
    () =>
      linhas.reduce(
        (soma, linha) =>
          soma +
          linha.produto.preco *
            linha.quantidade,
        0
      ),
    [linhas]
  );

  const quantidadeTotal = useMemo(
    () =>
      linhas.reduce(
        (soma, linha) =>
          soma + linha.quantidade,
        0
      ),
    [linhas]
  );

  return (
    <CarrinhoContext.Provider
      value={{
        linhas,
        adicionar,
        alterarQuantidade,
        remover,
        esvaziar,
        total,
        quantidadeTotal
      }}
    >
      {children}
    </CarrinhoContext.Provider>
  );
}

export const useCarrinho = () =>
  useContext(CarrinhoContext);