// Passo 2: routing no cliente
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import RotaProtegida from './components/RotaProtegida.jsx';
import Catalogo from './pages/Catalogo.jsx';
import Produto from './pages/Produto.jsx';
import Produtor from './pages/Produtor.jsx';
import Produtores from './pages/Produtores.jsx';
import Leiloes from './pages/Leiloes.jsx';
import SalaLeilao from './pages/SalaLeilao.jsx';
import Carrinho from './pages/Carrinho.jsx';
import Encomendas from './pages/Encomendas.jsx';
import Login from './pages/Login.jsx';
import Registo from './pages/Registo.jsx';
import PainelProdutor from './pages/produtor/Painel.jsx';
import ProdutosProdutor from './pages/produtor/Produtos.jsx';
import NovoLeilao from './pages/produtor/NovoLeilao.jsx';
import PainelAdmin from './pages/admin/Painel.jsx';
import NaoEncontrado from './pages/NaoEncontrado.jsx';
import Notificacoes from './components/Notificacoes.jsx';
import EditarPerfilProdutor from './pages/produtor/EditarPerfil.jsx';
import Inicio from './pages/Inicio.jsx';

export default function App() {
  return (
    <>
      <a
        href="#conteudo"
        className="visually-hidden-focusable position-absolute top-0 start-0 m-2 btn btn-dark"
      >
        Saltar para o conteúdo
      </a>

      <Navbar />

      <Notificacoes />

      <main
        id="conteudo"
        className="container-xl py-4"
        tabIndex="-1"
      >
        <Routes>
          {/* Visitante */}
          <Route path="/" element={<Inicio />} />
<Route path="/produtos" element={<Catalogo />} />
<Route path="/produtos/:id" element={<Produto />} />
<Route path="/produtores" element={<Produtores />} />
<Route path="/produtores/:id" element={<Produtor />} />
<Route path="/leiloes" element={<Leiloes />} />
<Route path="/login" element={<Login />} />
<Route path="/registo" element={<Registo />} />

          {/* Qualquer utilizador autenticado */}
<Route
  element={
    <RotaProtegida
      papeis={[
        'comprador',
        'produtor',
        'admin'
      ]}
    />
  }
>
  <Route
    path="/leiloes/:id"
    element={<SalaLeilao />}
  />
</Route>

{/* Comprador */}
<Route
  element={
    <RotaProtegida
      papeis={['comprador']}
    />
  }
>
  <Route
    path="/carrinho"
    element={<Carrinho />}
  />

  <Route
    path="/encomendas"
    element={<Encomendas />}
  />
</Route>

          {/* Produtor */}
<Route
  element={
    <RotaProtegida
      papeis={['produtor']}
    />
  }
>
  <Route
    path="/produtor"
    element={<PainelProdutor />}
  />

  <Route
    path="/produtor/perfil"
    element={<EditarPerfilProdutor />}
  />

  <Route
    path="/produtor/produtos"
    element={<ProdutosProdutor />}
  />

  <Route
    path="/produtor/leiloes/novo"
    element={<NovoLeilao />}
  />
</Route>

          {/* Administrador */}
          <Route element={<RotaProtegida papeis={['admin']} />}>
            <Route path="/admin" element={<PainelAdmin />} />
          </Route>

          {/* Página não encontrada */}
          <Route path="*" element={<NaoEncontrado />} />
        </Routes>
      </main>
    </>
  );
}