import {
  useEffect,
  useState
} from 'react';

import {
  Link,
  useNavigate
} from 'react-router-dom';

import {
  useAuth
} from '../../context/AuthContext.jsx';

import {
  api
} from '../../api/client.js';

const FORMULARIO_INICIAL = {
  produto: '',
  lote: '',
  descricao: '',
  quantidade: '',
  precoBase: '',
  incremento: '',
  iniciaEm: '',
  duracaoMinutos: '30'
};

export default function NovoLeilao() {
  const {
    utilizador,
    token
  } = useAuth();

  const navigate =
    useNavigate();

  const [produtos, setProdutos] =
    useState([]);

  const [aCarregarProdutos, setACarregarProdutos] =
    useState(true);

  const [formulario, setFormulario] =
    useState(
      FORMULARIO_INICIAL
    );

  const [aEnviar, setAEnviar] =
    useState(false);

  const [erro, setErro] =
    useState('');

  const [erroProdutos, setErroProdutos] =
    useState('');

  useEffect(() => {
    let ativo = true;

    async function carregarProdutos() {
      try {
        const dados = await api(
          `/products?produtor=${utilizador.id}`,
          {
            token
          }
        );

        if (!ativo) {
          return;
        }

        setProdutos(dados);
        setErroProdutos('');
      } catch (err) {
        if (!ativo) {
          return;
        }

        setErroProdutos(
          err.message
        );
      } finally {
        if (ativo) {
          setACarregarProdutos(
            false
          );
        }
      }
    }

    carregarProdutos();

    return () => {
      ativo = false;
    };
  }, [
    utilizador.id,
    token
  ]);

  function alterarCampo(evento) {
    const {
      name,
      value
    } = evento.target;

    setFormulario((atual) => ({
      ...atual,
      [name]: value
    }));
  }

  function alterarProduto(evento) {
    const produtoId =
      evento.target.value;

    const produto =
      produtos.find(
        (item) =>
          item._id === produtoId
      );

    setFormulario((atual) => ({
      ...atual,

      produto: produtoId,

      lote:
        atual.lote ||
        produto?.nome ||
        ''
    }));
  }

  async function submeter(evento) {
    evento.preventDefault();

    setErro('');

    const precoBase =
      Number(
        formulario.precoBase
      );

    const incremento =
      Number(
        formulario.incremento
      );

    const duracaoMinutos =
      Number(
        formulario.duracaoMinutos
      );

    if (
      !Number.isFinite(precoBase) ||
      precoBase < 0
    ) {
      setErro(
        'O preço base deve ser um valor válido.'
      );

      return;
    }

    if (
      !Number.isFinite(incremento) ||
      incremento < 0.01
    ) {
      setErro(
        'O incremento mínimo deve ser de pelo menos 0,01 €.'
      );

      return;
    }

    if (
      !Number.isFinite(
        duracaoMinutos
      ) ||
      duracaoMinutos <= 0
    ) {
      setErro(
        'A duração deve ser superior a zero minutos.'
      );

      return;
    }

    let iniciaEm;

    if (formulario.iniciaEm) {
      const dataInicio =
        new Date(
          formulario.iniciaEm
        );

      if (
        Number.isNaN(
          dataInicio.getTime()
        )
      ) {
        setErro(
          'A data de início não é válida.'
        );

        return;
      }

      iniciaEm =
        dataInicio.toISOString();
    }

    const corpo = {
      lote:
        formulario.lote.trim(),

      precoBase,
      incremento,
      duracaoMinutos
    };

    if (formulario.produto) {
      corpo.produto =
        formulario.produto;
    }

    if (
      formulario.descricao.trim()
    ) {
      corpo.descricao =
        formulario.descricao.trim();
    }

    if (
      formulario.quantidade.trim()
    ) {
      corpo.quantidade =
        formulario.quantidade.trim();
    }

    if (iniciaEm) {
      corpo.iniciaEm =
        iniciaEm;
    }

    try {
      setAEnviar(true);

      const leilao = await api(
        '/auctions',
        {
          metodo: 'POST',
          token,
          corpo
        }
      );

      navigate(
        `/leiloes/${leilao._id}`
      );
    } catch (err) {
      setErro(err.message);
    } finally {
      setAEnviar(false);
    }
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 className="mb-1">
            Criar leilão
          </h1>

          <p className="texto-secundario mb-0">
            Defina o lote, o preço e
            quando o leilão ficará
            disponível.
          </p>
        </div>

        <Link
          to="/produtor"
          className="btn btn-outline-secondary"
        >
          Voltar ao painel
        </Link>
      </div>

      {erroProdutos && (
        <div
          className="alert alert-warning"
          role="alert"
        >
          Não foi possível carregar os
          produtos: {erroProdutos}
        </div>
      )}

      <section
        className="card p-3 p-md-4"
        aria-labelledby="titulo-formulario-leilao"
      >
        <h2
          id="titulo-formulario-leilao"
          className="h5 mb-3"
        >
          Dados do leilão
        </h2>

        <form
          className="row g-3"
          onSubmit={submeter}
        >
          <div className="col-12">
            <label
              htmlFor="produto"
              className="form-label"
            >
              Produto associado
            </label>

            <select
              id="produto"
              name="produto"
              className="form-select"
              value={
                formulario.produto
              }
              onChange={
                alterarProduto
              }
              disabled={
                aCarregarProdutos
              }
            >
              <option value="">
                Sem produto associado
              </option>

              {produtos.map(
                (produto) => (
                  <option
                    key={produto._id}
                    value={produto._id}
                  >
                    {produto.nome}
                    {' — '}
                    stock: {produto.stock}{' '}
                    {produto.unidade}
                  </option>
                )
              )}
            </select>

            <div className="form-text">
              A associação é opcional.
              Se escolher um produto,
              a sua informação pode ser
              usada para apresentar o
              lote.
            </div>
          </div>

          <div className="col-12 col-md-8">
            <label
              htmlFor="lote"
              className="form-label"
            >
              Nome do lote
            </label>

            <input
              id="lote"
              name="lote"
              type="text"
              className="form-control"
              maxLength="150"
              required
              value={
                formulario.lote
              }
              onChange={
                alterarCampo
              }
              placeholder="Ex.: 20 kg de kiwi Hayward"
            />
          </div>

          <div className="col-12 col-md-4">
            <label
              htmlFor="quantidade"
              className="form-label"
            >
              Quantidade
            </label>

            <input
              id="quantidade"
              name="quantidade"
              type="text"
              className="form-control"
              value={
                formulario.quantidade
              }
              onChange={
                alterarCampo
              }
              placeholder="Ex.: 20 kg"
            />
          </div>

          <div className="col-12">
            <label
              htmlFor="descricao"
              className="form-label"
            >
              Descrição
            </label>

            <textarea
              id="descricao"
              name="descricao"
              className="form-control"
              rows="3"
              maxLength="1000"
              value={
                formulario.descricao
              }
              onChange={
                alterarCampo
              }
              placeholder="Descreva o lote e as suas características"
            />
          </div>

          <div className="col-12 col-md-4">
            <label
              htmlFor="precoBase"
              className="form-label"
            >
              Preço base (€)
            </label>

            <input
              id="precoBase"
              name="precoBase"
              type="number"
              className="form-control"
              min="0"
              step="0.01"
              required
              value={
                formulario.precoBase
              }
              onChange={
                alterarCampo
              }
            />
          </div>

          <div className="col-12 col-md-4">
            <label
              htmlFor="incremento"
              className="form-label"
            >
              Incremento mínimo (€)
            </label>

            <input
              id="incremento"
              name="incremento"
              type="number"
              className="form-control"
              min="0.01"
              step="0.01"
              required
              value={
                formulario.incremento
              }
              onChange={
                alterarCampo
              }
            />
          </div>

          <div className="col-12 col-md-4">
            <label
              htmlFor="duracaoMinutos"
              className="form-label"
            >
              Duração (minutos)
            </label>

            <input
              id="duracaoMinutos"
              name="duracaoMinutos"
              type="number"
              className="form-control"
              min="1"
              step="1"
              required
              value={
                formulario.duracaoMinutos
              }
              onChange={
                alterarCampo
              }
            />
          </div>

          <div className="col-12 col-md-6">
            <label
              htmlFor="iniciaEm"
              className="form-label"
            >
              Início
            </label>

            <input
              id="iniciaEm"
              name="iniciaEm"
              type="datetime-local"
              className="form-control"
              value={
                formulario.iniciaEm
              }
              onChange={
                alterarCampo
              }
            />

            <div className="form-text">
              Deixe vazio para iniciar
              imediatamente.
            </div>
          </div>

          <div className="col-12">
            {erro && (
              <div
                className="alert alert-danger"
                role="alert"
              >
                {erro}
              </div>
            )}

            <div className="d-flex flex-wrap gap-2">
              <button
                type="submit"
                className="btn btn-success"
                disabled={aEnviar}
              >
                {aEnviar
                  ? 'A criar...'
                  : 'Criar leilão'}
              </button>

              <Link
                to="/produtor"
                className="btn btn-outline-secondary"
              >
                Cancelar
              </Link>
            </div>
          </div>
        </form>
      </section>
    </>
  );
}