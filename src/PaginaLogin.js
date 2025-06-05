// src/PaginaLogin.js
import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { auth } from './firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';

const PaginaLogin = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      navigate('/');
    } catch (error) {
      console.error("Erro no login:", error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        setError('E-mail ou senha incorretos.');
      } else {
        setError('Ocorreu um erro ao fazer login.');
      }
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <Row className="w-100">
        <Col md={{ span: 6, offset: 3 }} lg={{ span: 4, offset: 4 }}>
          {/* AQUI ESTÁ A MUDANÇA: */}
          <Card className="shadow-lg" data-bs-theme="dark">
            <Card.Body className="p-4 p-md-5">
              <h2 className="text-center mb-4">Login</h2>
              <Form onSubmit={handleLogin}>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form.Group className="mb-3" controlId="formBasicEmail">
                  <Form.Label>Endereço de E-mail</Form.Label>
                  <Form.Control 
                    type="email" 
                    placeholder="Seu e-mail" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-4" controlId="formBasicPassword">
                  <Form.Label>Senha</Form.Label>
                  <Form.Control 
                    type="password" 
                    placeholder="Sua senha" 
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                  />
                </Form.Group>
                <div className="d-grid">
                  <Button variant="primary" type="submit" size="lg">
                    Entrar
                  </Button>
                </div>
              </Form>
              <div className="mt-4 text-center">
                <small className="text-muted">
                  Não tem uma conta? <RouterLink to="/cadastro">Cadastre-se aqui</RouterLink>
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PaginaLogin;