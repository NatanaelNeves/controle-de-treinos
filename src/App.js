// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link as RouterLink } from 'react-router-dom'; // Renomeamos Link para RouterLink para evitar conflito
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// 1. IMPORTAR COMPONENTES DO REACT-BOOTSTRAP
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/Button'; // Para o botão de logout

// Nossos componentes de página (sem mudanças aqui)
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
    // Idealmente, aqui você também redirecionaria para a página de login:
    // navigate('/login'); // Se você tiver 'navigate' disponível aqui
  };

  return (
    <Router>
      {/* 2. SUBSTITUIR A BARRA DE NAVEGAÇÃO ANTIGA PELA DO REACT-BOOTSTRAP */}
      <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
        <Container>
          <Navbar.Brand as={RouterLink} to="/">🏋️‍♂️ FitTrack Pro</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={RouterLink} to="/">Dashboard</Nav.Link>
              {usuario && (
                <>
                  <Nav.Link as={RouterLink} to="/exercicios">Meus Exercícios</Nav.Link>
                  <Nav.Link as={RouterLink} to="/meus-planos">Meus Planos</Nav.Link>
                  <Nav.Link as={RouterLink} to="/historico">Histórico</Nav.Link>
                </>
              )}
            </Nav>
            <Nav>
              {usuario ? (
                <>
                  <Navbar.Text className="me-2">
                    Olá, {usuario.email}!
                  </Navbar.Text>
                  <Button variant="outline-light" size="sm" onClick={handleLogout}>Sair</Button>
                </>
              ) : (
                <>
                  <Nav.Link as={RouterLink} to="/cadastro">Cadastrar</Nav.Link>
                  <Nav.Link as={RouterLink} to="/login">Login</Nav.Link>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* O conteúdo principal da página terá um padding para não ficar colado na navbar (opcional) */}
      <Container className="mt-4 mb-4"> {/* mt-4 adiciona margem no topo */}
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
            element={<RotaProtegida usuario={usuario}><PaginaDetalhesPlano /></RotaProtegida>}
          />
          <Route 
            path="/meus-planos/:planoId/grupos/:grupoId/exercicios"
            element={<RotaProtegida usuario={usuario}><PaginaGerenciarExerciciosGrupo /></RotaProtegida>}
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