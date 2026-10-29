import {
  useEffect,
  useState
} from 'react';

import {
  Link
} from 'react-router-dom';

import {
  api
} from '../../api/client.js';

import {
  useAuth
} from '../../context/AuthContext.jsx';

const FORMULARIO_VAZIO = {
  nomeExploracao: '',
  descricao: '',
  localidade: '',
  lat: '',
  lng: ''
};

export default function EditarPerfilProdutor() {
  const {
    utilizador,
    token,
    atualizar
  } = useAuth();

  const [
    formulario,
    setFormulario
  ] = useState(FORMULARIO_VAZIO);

  const [
    aGuardar,
    setAGuardar
  ] = useState(false);

  const [
    erro,
    setErro
  ] = useState('');

  const [
    mensagem,
    setMensagem
  ] = useState('');

  useEffect(() => {
    const perfil =
      utilizador?.produtor;

    if (!perfil) {
      return;
    }

    setFormulario({
      nomeExploracao:
        perfil.nomeExploracao || '',
      descricao:
        perfil.descricao || '',
      localidade:
        perfil.localidade || '',
      lat:
        perfil.localizacao?.lat ?? '',
      lng:
        perfil.localizacao?.lng ?? ''
    });
  }, [utilizador]);

  function alterar(campo) {
    return (evento) => {
      const {
        value
      } = evento.target;

      setFormulario((atual) => ({
        ...atual,
        [campo]: value
      }));
    };
  }

  async function guardar(evento) {
    evento.preventDefault();

    try {
      setAGuardar(true);
      setErro('');
      setMensagem('');

      const latitude =
        String(formulario.lat).trim();

      const longitude =
        String(formulario.lng).trim();

      if (
        (latitude && !longitude) ||
        (!latitude && longitude)
      ) {
        setErro(
          'Preencha a latitude e a longitude.'
        );

        return;
      }

      const corpo = {
        nomeExploracao:
          formulario.nomeExploracao.trim(),
        descricao:
          formulario.descricao.trim(),
        localidade:
          formulario.localidade.trim()
      };

      if (latitude && longitude) {
        corpo.localizacao = {
          lat: Number(latitude),
          lng: Number(longitude)
        };
      }

      await api(
        '/producers/me',
        {
          metodo: 'PATCH',
          token,
          corpo
        }
      );

      await atualizar();

      setMensagem(
        'Página pública atualizada com sucesso.'
      );
    } catch (err) {
      setErro(err.message);
    } finally {
      setAGuardar(false);
    }
  }

  const caracteresDescricao =
    formulario.descricao.length;

  return (
    <section
      aria-labelledby="titulo-editar-perfil"
      className="mx-auto"
      style={{
        maxWidth: '850px'
      }}
    >
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div>
          <p className="texto-secundario mb-1">
            PÁGINA PÚBLICA
          </p>

          <h1
            id="titulo-editar-perfil"
            className="mb-0"
          >
            Editar perfil do produtor
          </h1>
        </div>

        <Link
          to="/produtor"
          className="btn btn-outline-secondary"
        >
          Voltar ao painel
        </Link>
      </div>

      <p className="texto-secundario mb-4">
        Estes dados são apresentados aos
        visitantes na página pública da sua
        exploração.
      </p>

      {erro && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          {erro}
        </div>
      )}

      {mensagem && (
        <div
          className="alert alert-success"
          role="status"
        >
          {mensagem}
        </div>
      )}

      <form
        onSubmit={guardar}
        className="card p-4"
      >
        <div className="mb-3">
          <label
            htmlFor="nomeExploracao"
            className="form-label"
          >
            Nome da exploração
          </label>

          <input
            id="nomeExploracao"
            type="text"
            className="form-control"
            value={
              formulario.nomeExploracao
            }
            onChange={
              alterar('nomeExploracao')
            }
            maxLength={100}
            required
          />
        </div>

        <div className="mb-3">
          <label
            htmlFor="localidade"
            className="form-label"
          >
            Localidade
          </label>

          <input
            id="localidade"
            type="text"
            className="form-control"
            value={
              formulario.localidade
            }
            onChange={
              alterar('localidade')
            }
            required
          />

          <div className="form-text">
            Exemplo: Ponte de Lima
          </div>
        </div>

        <div className="mb-4">
          <label
            htmlFor="descricao"
            className="form-label"
          >
            Descrição da exploração
          </label>

          <textarea
            id="descricao"
            className="form-control"
            rows={5}
            maxLength={1000}
            value={
              formulario.descricao
            }
            onChange={
              alterar('descricao')
            }
            placeholder="Apresente a exploração, os produtos e o modo de produção."
          />

          <div className="form-text">
            {caracteresDescricao} / 1000
            caracteres
          </div>
        </div>

        <fieldset className="mb-4">
          <legend className="h5">
            Localização no mapa
          </legend>

          <p className="texto-secundario">
            Introduza as coordenadas da
            exploração para que a localização
            apareça no mapa da página pública.
          </p>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label
                htmlFor="latitude"
                className="form-label"
              >
                Latitude
              </label>

              <input
                id="latitude"
                type="number"
                step="any"
                min="-90"
                max="90"
                className="form-control"
                value={formulario.lat}
                onChange={alterar('lat')}
                placeholder="41.7670"
              />
            </div>

            <div className="col-12 col-md-6">
              <label
                htmlFor="longitude"
                className="form-label"
              >
                Longitude
              </label>

              <input
                id="longitude"
                type="number"
                step="any"
                min="-180"
                max="180"
                className="form-control"
                value={formulario.lng}
                onChange={alterar('lng')}
                placeholder="-8.5830"
              />
            </div>
          </div>
        </fieldset>

        <div className="d-flex flex-column flex-sm-row gap-2">
          <button
            type="submit"
            className="btn btn-success"
            disabled={aGuardar}
          >
            {aGuardar
              ? 'A guardar...'
              : 'Guardar alterações'}
          </button>

          {utilizador?.id && (
            <Link
              to={`/produtores/${utilizador.id}`}
              className="btn btn-outline-success"
            >
              Ver página pública
            </Link>
          )}
        </div>
      </form>
    </section>
  );
}