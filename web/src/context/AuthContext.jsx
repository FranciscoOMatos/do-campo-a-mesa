// Estado global da sessão: utilizador + token JWT
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react';

import { api } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(() => {
    try {
      return (
        JSON.parse(
          localStorage.getItem('sessao')
        ) || null
      );
    } catch {
      return null;
    }
  });

  const guardarSessao = useCallback((novaSessao) => {
    localStorage.setItem(
      'sessao',
      JSON.stringify(novaSessao)
    );

    setSessao(novaSessao);
  }, []);

  const sair = useCallback(() => {
    localStorage.removeItem('sessao');
    setSessao(null);
  }, []);

  const entrar = useCallback(
    async (email, password) => {
      const dados = await api('/auth/login', {
        metodo: 'POST',
        corpo: {
          email,
          password
        }
      });

      guardarSessao(dados);

      return dados.utilizador;
    },
    [guardarSessao]
  );

  const registar = useCallback(
    async (corpo) => {
      const dados = await api('/auth/registo', {
        metodo: 'POST',
        corpo
      });

      guardarSessao(dados);

      return dados.utilizador;
    },
    [guardarSessao]
  );

  const token = sessao?.token;

  // Confirma junto da API se a sessão guardada
  // continua válida.
  const atualizar = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const utilizador = await api(
        '/auth/eu',
        { token }
      );

      setSessao((atual) => {
        // Evita atualizar uma sessão que entretanto
        // tenha sido terminada ou substituída.
        if (!atual || atual.token !== token) {
          return atual;
        }

        const novaSessao = {
          ...atual,
          utilizador
        };

        localStorage.setItem(
          'sessao',
          JSON.stringify(novaSessao)
        );

        return novaSessao;
      });
    } catch (err) {
      if (err.status === 401) {
        sair();
      }
    }
  }, [token, sair]);

  useEffect(() => {
    atualizar();
  }, [atualizar]);

  return (
    <AuthContext.Provider
      value={{
        utilizador: sessao?.utilizador || null,
        token: sessao?.token || null,
        entrar,
        registar,
        sair,
        atualizar
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () =>
  useContext(AuthContext);