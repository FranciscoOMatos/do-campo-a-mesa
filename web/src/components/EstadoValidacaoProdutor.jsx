import { useState } from 'react';

import { useAuth } from '../context/AuthContext.jsx';

export default function EstadoValidacaoProdutor() {
  const { utilizador, atualizar } = useAuth();

  const [aVerificar, setAVerificar] = useState(false);

  const rejeitado =
    utilizador?.produtor?.estadoValidacao === 'rejeitado';

  async function verificarAprovacao() {
    setAVerificar(true);

    try {
      await atualizar();
    } finally {
      setAVerificar(false);
    }
  }

  return (
    <section className="py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-9 col-lg-7">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4 p-md-5 text-center">

              <h1 className="h3 mb-3">
                {rejeitado
                  ? 'Conta de produtor não aprovada'
                  : 'Conta pendente de aprovação'}
              </h1>

              <p className="text-muted mb-4" role="status">
                {rejeitado
                  ? 'O teu pedido de registo como produtor foi rejeitado. Contacta a administração para obteres mais informações.'
                  : 'O teu registo foi efetuado com sucesso. Aguarda a validação de um administrador para poderes gerir os teus produtos, encomendas e leilões.'}
              </p>

              <button
                type="button"
                className="btn btn-success"
                onClick={verificarAprovacao}
                disabled={aVerificar}
              >
                {aVerificar
                  ? 'A verificar...'
                  : 'Verificar estado da aprovação'}
              </button>

              <p className="small text-muted mt-3 mb-0">
                Após a aprovação, terás acesso ao painel do produtor.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}