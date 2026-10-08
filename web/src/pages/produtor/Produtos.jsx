import {
  useEffect,
  useRef,
  useState
} from 'react';

import { Link } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api/client.js';

const CATEGORIAS = [
  'Hortícolas',
  'Fruta',
  'Mel',
  'Vinho',
  'Queijo',
  'Padaria',
  'Outros'
];

const EPOCAS = [
  'Primavera',
  'Verão',
  'Outono',
  'Inverno'
];

const TIPOS_IMAGEM = [
  'image/jpeg',
  'image/png',
  'image/webp'
];

const TAMANHO_MAX_IMAGEM =
  5 * 1024 * 1024;

const FORMULARIO_INICIAL = {
  nome: '',
  descricao: '',
  categoria: 'Hortícolas',
  preco: '',
  unidade: 'kg',
  stock: '',
  biologico: false,
  epocas: []
};

const euro = (valor) =>
  Number(valor).toLocaleString(
    'pt-PT',
    {
      style: 'currency',
      currency: 'EUR'
    }
  );

export default function ProdutosProdutor() {
  const {
    utilizador,
    token
  } = useAuth();

  const [produtos, setProdutos] =
    useState([]);

  const [aCarregar, setACarregar] =
    useState(true);

  const [erro, setErro] =
    useState('');

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);

  const [produtoEmEdicao, setProdutoEmEdicao] =
    useState(null);

  const [formulario, setFormulario] =
    useState(FORMULARIO_INICIAL);

  const [aGuardar, setAGuardar] =
    useState(false);

  const [imagem, setImagem] =
    useState(null);

  const [previewImagem, setPreviewImagem] =
    useState('');

  const inputImagemRef =
    useRef(null);

  const [produtoAEliminar, setProdutoAEliminar] =
    useState(null);

  const [aEliminar, setAEliminar] =
    useState(false);

  const [mensagem, setMensagem] =
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
        setErro('');
      } catch (err) {
        if (!ativo) {
          return;
        }

        setErro(err.message);
      } finally {
        if (ativo) {
          setACarregar(false);
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

  useEffect(() => {
    return () => {
      if (
        previewImagem.startsWith(
          'blob:'
        )
      ) {
        URL.revokeObjectURL(
          previewImagem
        );
      }
    };
  }, [previewImagem]);

  function alterarImagem(evento) {
    const ficheiro =
      evento.target.files?.[0];

    if (!ficheiro) {
      setImagem(null);
      return;
    }

    if (
      !TIPOS_IMAGEM.includes(
        ficheiro.type
      )
    ) {
      setErro(
        'A imagem deve estar no formato JPEG, PNG ou WebP.'
      );

      evento.target.value = '';

      setImagem(null);

      return;
    }

    if (
      ficheiro.size >
      TAMANHO_MAX_IMAGEM
    ) {
      setErro(
        'A imagem não pode exceder 5 MB.'
      );

      evento.target.value = '';

      setImagem(null);

      return;
    }

    setErro('');
    setImagem(ficheiro);

    setPreviewImagem(
      URL.createObjectURL(
        ficheiro
      )
    );
  }

  async function enviarImagemProduto(
    produtoId
  ) {
    if (!imagem) {
      return null;
    }

    const dados =
      new FormData();

    dados.append(
      'imagem',
      imagem
    );

    return api(
      `/products/${produtoId}/imagem`,
      {
        metodo: 'POST',
        token,
        corpo: dados
      }
    );
  }

  function alterarCampo(evento) {
    const {
      name,
      value,
      type,
      checked
    } = evento.target;

    setFormulario((atual) => ({
      ...atual,
      [name]:
        type === 'checkbox'
          ? checked
          : value
    }));
  }

  function alterarEpoca(epoca) {
    setFormulario((atual) => {
      const selecionada =
        atual.epocas.includes(epoca);

      return {
        ...atual,
        epocas: selecionada
          ? atual.epocas.filter(
              (item) =>
                item !== epoca
            )
          : [
              ...atual.epocas,
              epoca
            ]
      };
    });
  }

  function abrirCriacao() {
    setProdutoEmEdicao(null);
    setProdutoAEliminar(null);

    setFormulario(
      FORMULARIO_INICIAL
    );

    setImagem(null);
    setPreviewImagem('');

    if (inputImagemRef.current) {
      inputImagemRef.current.value = '';
    }

    setMostrarFormulario(true);
    setMensagem('');
    setErro('');
  }

  function abrirEdicao(produto) {
    setProdutoEmEdicao(produto);
    setProdutoAEliminar(null);

    setImagem(null);

    setPreviewImagem(
      produto.imagemUrl || ''
    );

    if (inputImagemRef.current) {
      inputImagemRef.current.value = '';
    }

    setFormulario({
      nome: produto.nome,
      descricao:
        produto.descricao || '',
      categoria:
        produto.categoria,
      preco:
        String(produto.preco),
      unidade:
        produto.unidade || 'kg',
      stock:
        String(produto.stock),
      biologico:
        Boolean(
          produto.biologico
        ),
      epocas:
        produto.epocas || []
    });

    setMostrarFormulario(true);
    setMensagem('');
    setErro('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  function cancelarFormulario() {
    setImagem(null);
    setPreviewImagem('');

    if (inputImagemRef.current) {
      inputImagemRef.current.value = '';
    }

    setFormulario(
      FORMULARIO_INICIAL
    );

    setProdutoEmEdicao(null);
    setMostrarFormulario(false);
    setErro('');
  }

  async function guardarProduto(evento) {
    evento.preventDefault();

    try {
      setAGuardar(true);
      setErro('');
      setMensagem('');

      const corpo = {
        nome:
          formulario.nome.trim(),
        descricao:
          formulario.descricao.trim(),
        categoria:
          formulario.categoria,
        preco:
          Number(
            formulario.preco
          ),
        unidade:
          formulario.unidade.trim(),
        stock:
          Number(
            formulario.stock
          ),
        biologico:
          formulario.biologico,
        epocas:
          formulario.epocas
      };

      let produtoGuardado;

      if (produtoEmEdicao) {
        produtoGuardado =
          await api(
            `/products/${produtoEmEdicao._id}`,
            {
              metodo: 'PUT',
              token,
              corpo
            }
          );
      } else {
        produtoGuardado =
          await api(
            '/products',
            {
              metodo: 'POST',
              token,
              corpo
            }
          );
      }

      let erroImagem = null;

      if (imagem) {
        try {
          const resultadoImagem =
            await enviarImagemProduto(
              produtoGuardado._id
            );

          produtoGuardado = {
            ...produtoGuardado,
            imagemUrl:
              resultadoImagem.imagemUrl
          };
        } catch (err) {
          erroImagem = err;
        }
      }

      if (produtoEmEdicao) {
        setProdutos((atuais) =>
          atuais.map((produto) =>
            produto._id ===
            produtoGuardado._id
              ? produtoGuardado
              : produto
          )
        );
      } else {
        setProdutos((atuais) => [
          produtoGuardado,
          ...atuais
        ]);
      }

      const eraEdicao =
        Boolean(
          produtoEmEdicao
        );

      setFormulario(
        FORMULARIO_INICIAL
      );

      setProdutoEmEdicao(null);
      setImagem(null);
      setPreviewImagem('');
      setMostrarFormulario(false);

      if (inputImagemRef.current) {
        inputImagemRef.current.value = '';
      }

      if (erroImagem) {
        setErro(
          `${
            eraEdicao
              ? 'Produto atualizado'
              : 'Produto criado'
          }, mas não foi possível guardar a imagem: ${erroImagem.message}`
        );

        return;
      }

      setMensagem(
        eraEdicao
          ? 'Produto atualizado com sucesso.'
          : 'Produto criado com sucesso.'
      );
    } catch (err) {
      setErro(err.message);
    } finally {
      setAGuardar(false);
    }
  }

  function pedirEliminacao(
    produto
  ) {
    setProdutoAEliminar(
      produto
    );

    setMensagem('');
    setErro('');
  }

  function cancelarEliminacao() {
    setProdutoAEliminar(null);
  }

  async function eliminarProduto() {
    if (!produtoAEliminar) {
      return;
    }

    try {
      setAEliminar(true);
      setErro('');
      setMensagem('');

      await api(
        `/products/${produtoAEliminar._id}`,
        {
          metodo: 'DELETE',
          token
        }
      );

      setProdutos((atuais) =>
        atuais.filter(
          (produto) =>
            produto._id !==
            produtoAEliminar._id
        )
      );

      if (
        produtoEmEdicao?._id ===
        produtoAEliminar._id
      ) {
        setProdutoEmEdicao(null);

        setFormulario(
          FORMULARIO_INICIAL
        );

        setImagem(null);
        setPreviewImagem('');

        if (
          inputImagemRef.current
        ) {
          inputImagemRef.current.value =
            '';
        }

        setMostrarFormulario(false);
      }

      setProdutoAEliminar(null);

      setMensagem(
        'Produto eliminado com sucesso.'
      );
    } catch (err) {
      setErro(err.message);
    } finally {
      setAEliminar(false);
    }
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 className="mb-1">
            Gestão de produtos
          </h1>

          <p className="texto-secundario mb-0">
            Crie e mantenha atualizado o catálogo da sua exploração.
          </p>
        </div>

        <Link
          to="/produtor"
          className="btn btn-outline-secondary"
        >
          Voltar ao painel
        </Link>
      </div>

      {mensagem && (
        <div
          className="alert alert-success"
          role="status"
        >
          {mensagem}
        </div>
      )}

      {erro && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          {erro}
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h2 className="h4 mb-0">
          Os meus produtos
        </h2>

        <div className="d-flex align-items-center flex-wrap gap-3">
          {!aCarregar && (
            <span className="texto-secundario">
              {produtos.length}{' '}
              {produtos.length === 1
                ? 'produto'
                : 'produtos'}
            </span>
          )}

          {!mostrarFormulario && (
            <button
              type="button"
              className="btn btn-success"
              onClick={
                abrirCriacao
              }
            >
              Novo produto
            </button>
          )}
        </div>
      </div>

      {mostrarFormulario && (
        <section
          className="card p-3 p-md-4 mb-4"
          aria-labelledby="titulo-formulario-produto"
        >
          <h3
            id="titulo-formulario-produto"
            className="h5 mb-3"
          >
            {produtoEmEdicao
              ? 'Editar produto'
              : 'Novo produto'}
          </h3>

          <form
            onSubmit={
              guardarProduto
            }
            className="row g-3"
          >
            <div className="col-12 col-md-6">
              <label
                htmlFor="nome"
                className="form-label"
              >
                Nome
              </label>

              <input
                id="nome"
                name="nome"
                type="text"
                className="form-control"
                value={
                  formulario.nome
                }
                onChange={
                  alterarCampo
                }
                required
              />
            </div>

            <div className="col-12 col-md-6">
              <label
                htmlFor="categoria"
                className="form-label"
              >
                Categoria
              </label>

              <select
                id="categoria"
                name="categoria"
                className="form-select"
                value={
                  formulario.categoria
                }
                onChange={
                  alterarCampo
                }
                required
              >
                {CATEGORIAS.map(
                  (categoria) => (
                    <option
                      key={
                        categoria
                      }
                      value={
                        categoria
                      }
                    >
                      {categoria}
                    </option>
                  )
                )}
              </select>
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
                value={
                  formulario.descricao
                }
                onChange={
                  alterarCampo
                }
                placeholder="Descreva brevemente o produto"
              />
            </div>

            <div className="col-12 col-sm-4">
              <label
                htmlFor="preco"
                className="form-label"
              >
                Preço
              </label>

              <input
                id="preco"
                name="preco"
                type="number"
                className="form-control"
                min="0"
                step="0.01"
                value={
                  formulario.preco
                }
                onChange={
                  alterarCampo
                }
                required
              />
            </div>

            <div className="col-12 col-sm-4">
              <label
                htmlFor="unidade"
                className="form-label"
              >
                Unidade
              </label>

              <input
                id="unidade"
                name="unidade"
                type="text"
                className="form-control"
                value={
                  formulario.unidade
                }
                onChange={
                  alterarCampo
                }
                required
              />
            </div>

            <div className="col-12 col-sm-4">
              <label
                htmlFor="stock"
                className="form-label"
              >
                Stock
              </label>

              <input
                id="stock"
                name="stock"
                type="number"
                className="form-control"
                min="0"
                step="1"
                value={
                  formulario.stock
                }
                onChange={
                  alterarCampo
                }
                required
              />
            </div>

            <div className="col-12">
              <label
                htmlFor="imagem"
                className="form-label"
              >
                Imagem do produto
              </label>

              <input
                ref={
                  inputImagemRef
                }
                id="imagem"
                name="imagem"
                type="file"
                className="form-control"
                accept="image/jpeg,image/png,image/webp"
                onChange={
                  alterarImagem
                }
              />

              <div className="form-text">
                JPEG, PNG ou WebP, até 5 MB.
              </div>

              {previewImagem && (
                <div className="mt-3">
                  <img
                    src={
                      previewImagem
                    }
                    alt={`Pré-visualização de ${
                      formulario.nome ||
                      'produto'
                    }`}
                    width="180"
                    height="120"
                    className="img-thumbnail object-fit-cover"
                  />
                </div>
              )}
            </div>

            <div className="col-12">
              <fieldset>
                <legend className="form-label">
                  Épocas
                </legend>

                <div className="d-flex flex-wrap gap-3">
                  {EPOCAS.map(
                    (epoca) => (
                      <div
                        key={
                          epoca
                        }
                        className="form-check"
                      >
                        <input
                          id={`epoca-${epoca}`}
                          type="checkbox"
                          className="form-check-input"
                          checked={
                            formulario.epocas.includes(
                              epoca
                            )
                          }
                          onChange={() =>
                            alterarEpoca(
                              epoca
                            )
                          }
                        />

                        <label
                          htmlFor={`epoca-${epoca}`}
                          className="form-check-label"
                        >
                          {epoca}
                        </label>
                      </div>
                    )
                  )}
                </div>
              </fieldset>
            </div>

            <div className="col-12">
              <div className="form-check">
                <input
                  id="biologico"
                  name="biologico"
                  type="checkbox"
                  className="form-check-input"
                  checked={
                    formulario.biologico
                  }
                  onChange={
                    alterarCampo
                  }
                />

                <label
                  htmlFor="biologico"
                  className="form-check-label"
                >
                  Produto biológico
                </label>
              </div>
            </div>

            <div className="col-12 d-flex flex-wrap gap-2">
              <button
                type="submit"
                className="btn btn-success"
                disabled={
                  aGuardar
                }
              >
                {aGuardar
                  ? 'A guardar...'
                  : produtoEmEdicao
                    ? 'Guardar alterações'
                    : 'Criar produto'}
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={
                  cancelarFormulario
                }
                disabled={
                  aGuardar
                }
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      {aCarregar && (
        <p
          className="texto-secundario"
          role="status"
        >
          A carregar produtos...
        </p>
      )}

      {!aCarregar &&
        !erro &&
        produtos.length === 0 && (
          <div className="alert alert-info">
            Ainda não tem produtos no catálogo.
          </div>
        )}

      {!aCarregar &&
        produtos.length > 0 && (
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th scope="col">
                    Imagem
                  </th>

                  <th scope="col">
                    Produto
                  </th>

                  <th scope="col">
                    Categoria
                  </th>

                  <th scope="col">
                    Preço
                  </th>

                  <th scope="col">
                    Stock
                  </th>

                  <th scope="col">
                    Biológico
                  </th>

                  <th scope="col">
                    Épocas
                  </th>

                  <th
                    scope="col"
                    className="text-end"
                  >
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {produtos.map(
                  (produto) => (
                    <tr
                      key={
                        produto._id
                      }
                    >
                      <td>
                        {produto.imagemUrl ? (
                          <img
                            src={
                              produto.imagemUrl
                            }
                            alt={`Imagem de ${produto.nome}`}
                            width="64"
                            height="48"
                            className="rounded border object-fit-cover"
                          />
                        ) : (
                          <span className="texto-secundario small">
                            Sem imagem
                          </span>
                        )}
                      </td>

                      <th scope="row">
                        {produto.nome}
                      </th>

                      <td>
                        {
                          produto.categoria
                        }
                      </td>

                      <td>
                        {euro(
                          produto.preco
                        )}{' '}
                        <span className="texto-secundario small">
                          /{' '}
                          {
                            produto.unidade
                          }
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            produto.stock <=
                            5
                              ? 'badge text-bg-warning'
                              : ''
                          }
                        >
                          {
                            produto.stock
                          }
                        </span>
                      </td>

                      <td>
                        {produto.biologico
                          ? 'Sim'
                          : 'Não'}
                      </td>

                      <td>
                        {produto.epocas
                          ?.length
                          ? produto.epocas.join(
                              ', '
                            )
                          : '—'}
                      </td>

                      <td className="text-end">
                        {produtoAEliminar?._id ===
                        produto._id ? (
                          <div className="d-flex justify-content-end align-items-center flex-wrap gap-2">
                            <span className="small">
                              Eliminar?
                            </span>

                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={
                                eliminarProduto
                              }
                              disabled={
                                aEliminar
                              }
                            >
                              {aEliminar
                                ? 'A eliminar...'
                                : 'Confirmar'}
                            </button>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={
                                cancelarEliminacao
                              }
                              disabled={
                                aEliminar
                              }
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="d-flex justify-content-end flex-wrap gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() =>
                                abrirEdicao(
                                  produto
                                )
                              }
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() =>
                                pedirEliminacao(
                                  produto
                                )
                              }
                            >
                              Eliminar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
    </>
  );
}