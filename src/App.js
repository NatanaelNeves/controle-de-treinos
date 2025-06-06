// src/App.js

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link as RouterLink } from 'react-router-dom';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ToastProvider, useToast } from './context/ToastContext';

// Imports do React-Bootstrap
import { Container, Nav, Navbar, Button, Spinner } from 'react-bootstrap';

// Imports dos Ícones
import { 
  FaTachometerAlt, 
  FaDumbbell, 
  FaClipboardList, 
  FaCalendarAlt, 
  FaSignOutAlt, 
  FaUserPlus, 
  FaSignInAlt,
  FaTrophy 
} from 'react-icons/fa';

// Nossos componentes de página
import PaginaCadastro from './PaginaCadastro';
import PaginaLogin from './PaginaLogin';
import PaginaPrincipal from './PaginaPrincipal';
import PaginaExercicios from './PaginaExercicios';
import PaginaRegistrarProgresso from './PaginaRegistrarProgresso';
import PaginaHistorico from './PaginaHistorico';
import PaginaMeusPlanos from './PaginaMeusPlanos';
import PaginaDetalhesPlano from './PaginaDetalhesPlano';
import PaginaGerenciarExerciciosGrupo from './PaginaGerenciarExerciciosGrupo';
import PaginaMeusRecordes from './PaginaMeusRecordes';
import RotaProtegida from './RotaProtegida';

// Componente interno para gerenciar o conteúdo que precisa de acesso aos contextos
function AppContent() {
  const [usuario, setUsuario] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      setAuthLoading(false); // A verificação inicial terminou
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showToast('Logout efetuado com sucesso!', 'info');
    } catch (error) {
      showToast('Erro ao fazer logout.', 'danger');
    }
  };

  return (
    <Router>
      <Navbar bg="dark" variant="dark" expand="lg" sticky="top" className="shadow-sm">
        <Container fluid>
          <Navbar.Brand as={RouterLink} to="/">
            <FaDumbbell className="me-2"/>FitTrack Pro
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={RouterLink} to="/"><FaTachometerAlt className="me-2" />Dashboard</Nav.Link>
              {usuario && (
                <>
                  <Nav.Link as={RouterLink} to="/exercicios"><FaDumbbell className="me-2" />Meus Exercícios</Nav.Link>
                  <Nav.Link as={RouterLink} to="/meus-planos"><FaClipboardList className="me-2" />Meus Planos</Nav.Link>
                  <Nav.Link as={RouterLink} to="/historico"><FaCalendarAlt className="me-2" />Histórico</Nav.Link>
                  <Nav.Link as={RouterLink} to="/meus-recordes"><FaTrophy className="me-2" />Meus Recordes</Nav.Link>
                </>
              )}
            </Nav>
            <Nav>
              {usuario ? (
                <>
                  <Navbar.Text className="me-3 d-none d-lg-block">
                    Olá, {usuario.email}!
                  </Navbar.Text>
                  <Button variant="outline-danger" size="sm" onClick={handleLogout}>
                    <FaSignOutAlt className="me-1" /> Sair
                  </Button>
                </>
              ) : (
                !authLoading && ( // Só mostra os botões de Login/Cadastro quando o loading da auth terminar
                  <>
                    <Nav.Link as={RouterLink} to="/cadastro"><FaUserPlus className="me-2" />Cadastrar</Nav.Link>
                    <Nav.Link as={RouterLink} to="/login"><FaSignInAlt className="me-2" />Login</Nav.Link>
                  </>
                )
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="mt-4 mb-4">
        <Routes>
          <Route path="/cadastro" element={<PaginaCadastro />} />
          <Route path="/login" element={<PaginaLogin />} />
          
          <Route path="/exercicios" element={<RotaProtegida usuario={usuario} authLoading={authLoading}><PaginaExercicios /></RotaProtegida>} />
          <Route path="/registrar-progresso" element={<RotaProtegida usuario={usuario} authLoading={authLoading}><PaginaRegistrarProgresso /></RotaProtegida>} />
          <Route path="/historico" element={<RotaProtegida usuario={usuario} authLoading={authLoading}><PaginaHistorico /></RotaProtegida>} />
          <Route path="/meus-planos" element={<RotaProtegida usuario={usuario} authLoading={authLoading}><PaginaMeusPlanos /></RotaProtegida>} />
          <Route path="/meus-recordes" element={<RotaProtegida usuario={usuario} authLoading={authLoading}><PaginaMeusRecordes /></RotaProtegida>} />
          <Route path="/meus-planos/:planoId" element={<RotaProtegida usuario={usuario} authLoading={authLoading}><PaginaDetalhesPlano /></RotaProtegida>} />
          <Route path="/meus-planos/:planoId/grupos/:grupoId/exercicios" element={<RotaProtegida usuario={usuario} authLoading={authLoading}><PaginaGerenciarExerciciosGrupo /></RotaProtegida>} />
          <Route path="/" element={<RotaProtegida usuario={usuario} authLoading={authLoading}><PaginaPrincipal /></RotaProtegida>} />
        </Routes>
      </Container>
    </Router>
  );
}

// O componente App principal agora só provê o contexto e renderiza o AppContent
function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;