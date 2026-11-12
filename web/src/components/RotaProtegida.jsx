// Protege rotas por autenticação, papel e validação do produtor.
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';

import EstadoValidacaoProdutor from './EstadoValidacaoProdutor.jsx';

export default function RotaProtegida({
  papeis = [],
  exigirValidacaoProdutor = false
}) {
  const { utilizador } = useAuth();
  const location = useLocation();

  if (!utilizador) {
    return (
      <Navigate
        to="/login"
        state={{ de: location.pathname }}
        replace
      />
    );
  }

  if (
    papeis.length &&
    !papeis.includes(utilizador.papel)
  ) {
    return <Navigate to="/" replace />;
  }

  if (
    exigirValidacaoProdutor &&
    utilizador.papel === 'produtor' &&
    utilizador.produtor?.validado !== true
  ) {
    return <EstadoValidacaoProdutor />;
  }

  return <Outlet />;
}