import { useState } from 'react';
import {
  useLocation,
  useNavigate
} from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';

const INICIO = {
  comprador: '/',
  produtor: '/produtor',
  admin: '/admin'
};

export default function Login() {
  const { entrar } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [dados, setDados] = useState({
    email: '',
    password: ''
  });

  const [erro, setErro] = useState('');
  const [aEnviar, setAEnviar] = useState(false);

  const mudar = (campo) => (e) => {
    setDados((atual) => ({
      ...atual,
      [campo]: e.target.value
    }));
  };

  async function submeter(e) {
    e.preventDefault();

    setErro('');
    setAEnviar(true);

    try {
      const utilizador = await entrar(
        dados.email,
        dados.password
      );

      navigate(
        location.state?.de ||
        INICIO[utilizador.papel] ||
        '/'
      );
    } catch (err) {
      setErro(err.message);
    } finally {
      setAEnviar(false);
    }
  }

  return (
    <form
      className="formulario-estreito"
      onSubmit={submeter}
    >
      <h1>Entrar</h1>

      <label
        htmlFor="email"
        className="form-label"
      >
        Email
      </label>

      <input
        id="email"
        type="email"
        className="form-control mb-3"
        autoComplete="email"
        required
        value={dados.email}
        onChange={mudar('email')}
      />

      <label
        htmlFor="password"
        className="form-label"
      >
        Password
      </label>

      <input
        id="password"
        type="password"
        className="form-control mb-3"
        autoComplete="current-password"
        required
        value={dados.password}
        onChange={mudar('password')}
      />

      {erro && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          {erro}
        </div>
      )}

      <button
        type="submit"
        className="btn btn-success w-100"
        disabled={aEnviar}
      >
        {aEnviar
          ? 'A entrar...'
          : 'Entrar'}
      </button>
    </form>
  );
}