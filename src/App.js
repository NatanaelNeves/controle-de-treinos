// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link as RouterLink } from 'react-router-dom';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// Imports do React-Bootstrap
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/Button';

// Imports dos Ícones
import { 
  FaTachometerAlt,    // Ícone para Dashboard
  FaDumbbell,         // Ícone para Exercícios e logo
  FaClipboardList,    // Ícone para Planos
  FaCalendarAlt,      // Ícone para Histórico
  FaSignOutAlt,       // Ícone para Sair
  FaUserPlus,         // Ícone para Cadastrar
  FaSignInAlt         // Ícone para Login
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
import RotaProtegida from './RotaProtegida';

function App() {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    alert("Logout efetuado com sucesso!");
    // O redirecionamento já acontece naturalmente porque o estado 'usuario' mudará para null
  };

  return (
    <Router>
      <Navbar bg="dark" variant="dark" expand="lg" sticky="top" className="shadow-sm">
        <Container fluid>
          <Navbar.Brand as={RouterLink} to="/">
            <FaDumbbell className="me-2"/>
            FitTrack Pro
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={RouterLink} to="/">
                <FaTachometerAlt className="me-2" />Dashboard
              </Nav.Link>
              {usuario && (
                <>
                  <Nav.Link as={RouterLink} to="/exercicios">
                    <FaDumbbell className="me-2" />Meus Exercícios
                  </Nav.Link>
                  <Nav.Link as={RouterLink} to="/meus-planos">
                    <FaClipboardList className="me-2" />Meus Planos
                  </Nav.Link>
                  <Nav.Link as={RouterLink} to="/historico">
                    <FaCalendarAlt className="me-2" />Histórico
                  </Nav.Link>
                </>
              )}
            </Nav>
            <Nav>
              {usuario ? (
                <>
                  <Navbar.Text className="me-3 d-none d-lg-block"> {/* Esconde em telas pequenas para não quebrar o layout */}
                    Olá, {usuario.email}!
                  </Navbar.Text>
                  <Button variant="outline-danger" size="sm" onClick={handleLogout}>
                    <FaSignOutAlt className="me-1" /> Sair
                  </Button>
                </>
              ) : (
                <>
                  <Nav.Link as={RouterLink} to="/cadastro">
                    <FaUserPlus className="me-2" />Cadastrar
                  </Nav.Link>
                  <Nav.Link as={RouterLink} to="/login">
                    <FaSignInAlt className="me-2" />Login
                  </Nav.Link>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="mt-4 mb-4">
        <Routes>
          <Route path="/cadastro" element={<PaginaCadastro />} />
          <Route path="/login" element={<PaginaLogin />} />
          
          <Route 
            path="/exercicios" 
            element={<RotaProtegida usuario={usuario}><PaginaExercicios usuario={usuario} /></RotaProtegida>} 
          />
          <Route 
            path="/registrar-progresso"
            element={<RotaProtegida usuario={usuario}><PaginaRegistrarProgresso usuario={usuario} /></RotaProtegida>}
          />
          <Route 
            path="/historico"
            element={<RotaProtegida usuario={usuario}><PaginaHistorico usuario={usuario} /></RotaProtegida>}
          />
          <Route 
            path="/meus-planos"
            element={<RotaProtegida usuario={usuario}><PaginaMeusPlanos usuario={usuario} /></RotaProtegida>}
          />
          <Route 
            path="/meus-planos/:planoId" 
            element={<RotaProtegida usuario={usuario}><PaginaDetalhesPlano usuario={usuario} /></RotaProtegida>}
          />
          <Route 
            path="/meus-planos/:planoId/grupos/:grupoId/exercicios"
            element={<RotaProtegida usuario={usuario}><PaginaGerenciarExerciciosGrupo usuario={usuario} /></RotaProtegida>}
          />
          <Route 
            path="/" 
            element={<RotaProtegida usuario={usuario}><PaginaPrincipal /></RotaProtegida>} 
          />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;