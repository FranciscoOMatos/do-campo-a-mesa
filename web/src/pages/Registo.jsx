import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';

const ESTADO_INICIAL = {
  nome: '',
  email: '',
  password: '',
  papel: 'comprador',
  nomeExploracao: '',
  localidade: ''
};

export default function Registo() {
  const { registar } = useAuth();
  const navigate = useNavigate();

  const [dados, setDados] = useState(
    ESTADO_INICIAL
  );

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
      const corpo = {
        nome: dados.nome,
        email: dados.email,
        password: dados.password,
        papel: dados.papel
      };

      if (dados.papel === 'produtor') {
        corpo.produtor = {
          nomeExploracao: dados.nomeExploracao,
          localidade: dados.localidade
        };
      }

      const utilizador = await registar(corpo);

      navigate(
        utilizador.papel === 'produtor'
          ? '/produtor'
          : '/'
      );
    } catch (err) {
      setErro(err.message);
    } finally {
      setAEnviar(false);
    }
  }

  const eProdutor =
    dados.papel === 'produtor';

  return (
    <form
      className="formulario-estreito"
      onSubmit={submeter}
    >
      <h1>Registar</h1>

      <label
        htmlFor="nome"
        className="form-label"
      >
        Nome
      </label>

      <input
        id="nome"
        type="text"
        className="form-control mb-3"
        autoComplete="name"
        required
        maxLength="100"
        value={dados.nome}
        onChange={mudar('nome')}
      />

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
        className="form-control"
        autoComplete="new-password"
        required
        minLength="8"
        value={dados.password}
        onChange={mudar('password')}
      />

      <div className="form-text mb-3">
        A password deve ter pelo menos 8 caracteres.
      </div>

      <label
        htmlFor="papel"
        className="form-label"
      >
        Tipo de conta
      </label>

      <select
        id="papel"
        className="form-select mb-3"
        value={dados.papel}
        onChange={mudar('papel')}
      >
        <option value="comprador">
          Comprador
        </option>

        <option value="produtor">
          Produtor
        </option>
      </select>

      {eProdutor && (
        <>
          <label
            htmlFor="nomeExploracao"
            className="form-label"
          >
            Nome da exploração
          </label>

          <input
            id="nomeExploracao"
            type="text"
            className="form-control mb-3"
            required
            value={dados.nomeExploracao}
            onChange={mudar('nomeExploracao')}
          />

          <label
            htmlFor="localidade"
            className="form-label"
          >
            Localidade
          </label>

          <input
            id="localidade"
            type="text"
            className="form-control mb-3"
            required
            value={dados.localidade}
            onChange={mudar('localidade')}
          />
        </>
      )}

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
          ? 'A registar...'
          : 'Criar conta'}
      </button>
    </form>
  );
}