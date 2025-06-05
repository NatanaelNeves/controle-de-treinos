// src/PaginaCadastro.js
import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'; // serverTimestamp é uma boa prática

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';

const PaginaCadastro = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleCadastro = async (e) => {
    e.preventDefault();
    setError('');
    if (senha.length < 6) {
        setError("A senha deve ter no mínimo 6 caracteres.");
        return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;
      await setDoc(doc(db, "usuarios", user.uid), {
        nome: nome,
        email: email,
        dataCriacao: serverTimestamp() // Usando timestamp do servidor
      });
      alert("Usuário cadastrado com sucesso!");
      navigate('/');
    } catch (error) {
      console.error("Erro no cadastro:", error);
      if (error.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso.');
      } else {
        setError('Ocorreu um erro ao cadastrar.');
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
              <h2 className="text-center mb-4">Criar Conta</h2>
              <Form onSubmit={handleCadastro}>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form.Group className="mb-3" controlId="formBasicNome">
                  <Form.Label>Nome</Form.Label>
                  <Form.Control type="text" placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
                </Form.Group>
                <Form.Group className="mb-3" controlId="formBasicEmail">
                  <Form.Label>Endereço de E-mail</Form.Label>
                  <Form.Control type="email" placeholder="Seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </Form.Group>
                <Form.Group className="mb-4" controlId="formBasicPassword">
                  <Form.Label>Senha</Form.Label>
                  <Form.Control type="password" placeholder="Mínimo 6 caracteres" value={senha} onChange={(e) => setSenha(e.target.value)} required />
                </Form.Group>
                <div className="d-grid">
                  <Button variant="primary" type="submit" size="lg">
                    Cadastrar
                  </Button>
                </div>
              </Form>
              <div className="mt-4 text-center">
                <small className="text-muted">
                  Já tem uma conta? <RouterLink to="/login">Faça o login</RouterLink>
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PaginaCadastro;