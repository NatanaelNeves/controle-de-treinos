// src/PaginaExercicios.js
import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { 
    collection, addDoc, onSnapshot, query, where, doc, deleteDoc, updateDoc, orderBy 
} from 'firebase/firestore'; // Adicionado orderBy

// Imports do React-Bootstrap
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import Spinner from 'react-bootstrap/Spinner';
import InputGroup from 'react-bootstrap/InputGroup'; // Para o modo de edição

const PaginaExercicios = ({ usuario }) => {
  const [nome, setNome] = useState('');
  const [grupoMuscular, setGrupoMuscular] = useState('Peito');
  const [tipo, setTipo] = useState('Composto');
  const [exercicios, setExercicios] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editandoEx, setEditandoEx] = useState(null);
  const [novoNome, setNovoNome] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buscar os exercícios
  useEffect(() => {
    if (!usuario) {
      setExercicios([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    // Adicionado orderBy para ordenar a lista por nome
    const q = query(collection(db, "exercicios"), where("userId", "==", usuario.uid), orderBy("nome", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const exerciciosDoUsuario = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExercicios(exerciciosDoUsuario);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar exercícios: ", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [usuario]);

  // Adicionar um exercício
  const handleAddExercicio = async (e) => {
    e.preventDefault();
    if (!nome.trim() || !usuario) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'exercicios'), {
        nome: nome.trim(),
        grupoMuscular: grupoMuscular,
        tipo: tipo,
        userId: usuario.uid,
      });
      setNome('');
      setGrupoMuscular('Peito'); // Reseta para o padrão
      setTipo('Composto');      // Reseta para o padrão
    } catch (error) {
      console.error("Erro ao adicionar exercício: ", error);
    }
    setIsSubmitting(false);
  };

  // Deletar um exercício
  const handleDeleteExercicio = async (id) => {
    if (window.confirm("Tem certeza que deseja deletar este exercício?")) {
      try {
        await deleteDoc(doc(db, 'exercicios', id));
      } catch (error) {
        console.error("Erro ao deletar exercício: ", error);
      }
    }
  };

  // Atualizar um exercício
  const handleUpdateExercicio = async (id) => {
    if (!novoNome.trim()) return;
    try {
      const exDocRef = doc(db, 'exercicios', id);
      await updateDoc(exDocRef, { nome: novoNome.trim() });
      setEditandoEx(null);
      setNovoNome('');
    } catch (error) {
      console.error("Erro ao atualizar exercício: ", error);
    }
  };

  return (
    <>
      <h2 className="mb-4">Minha Biblioteca de Exercícios</h2>
      <Row>
        {/* Coluna do Formulário */}
        <Col md={5} lg={4} className="mb-4 mb-md-0">
          <Card data-bs-theme="dark">
            <Card.Body>
              <Card.Title as="h3">Adicionar Novo Exercício</Card.Title>
              <Form onSubmit={handleAddExercicio}>
                <Form.Group className="mb-3" controlId="nomeExercicio">
                  <Form.Label>Nome do Exercício</Form.Label>
                  <Form.Control type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Supino Reto" required />
                </Form.Group>
                <Form.Group className="mb-3" controlId="grupoMuscular">
                  <Form.Label>Grupo Muscular</Form.Label>
                  <Form.Select value={grupoMuscular} onChange={(e) => setGrupoMuscular(e.target.value)}>
                    <option value="Peito">Peito</option>
                    <option value="Costas">Costas</option>
                    <option value="Pernas">Pernas</option>
                    <option value="Ombros">Ombros</option>
                    <option value="Bíceps">Bíceps</option>
                    <option value="Tríceps">Tríceps</option>
                    <option value="Abdômen">Abdômen</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3" controlId="tipoExercicio">
                  <Form.Label>Tipo</Form.Label>
                  <Form.Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                    <option value="Composto">Composto</option>
                    <option value="Isolado">Isolado</option>
                    <option value="Máquina">Máquina</option>
                    <option value="Livre">Livre</option>
                  </Form.Select>
                </Form.Group>
                <div className="d-grid">
                  <Button variant="primary" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Spinner as="span" size="sm" /> : 'Adicionar'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Coluna da Lista de Exercícios */}
        <Col md={7} lg={8}>
          <Card data-bs-theme="dark">
            <Card.Header as="h3">Exercícios Cadastrados ({exercicios.length})</Card.Header>
            {loading ? (
              <Card.Body className="text-center"><Spinner animation="border" /></Card.Body>
            ) : (
              exercicios.length === 0 ? (
                <Card.Body><p className="text-muted">Nenhum exercício cadastrado ainda.</p></Card.Body>
              ) : (
                <ListGroup variant="flush">
                  {exercicios.map(ex => (
                    <ListGroup.Item key={ex.id}>
                      {editandoEx === ex.id ? (
                        // Modo de Edição
                        <InputGroup>
                          <Form.Control 
                            type="text" 
                            value={novoNome} 
                            onChange={(e) => setNovoNome(e.target.value)}
                            autoFocus
                          />
                          <Button variant="success" onClick={() => handleUpdateExercicio(ex.id)}>Salvar</Button>
                          <Button variant="outline-secondary" onClick={() => setEditandoEx(null)}>Cancelar</Button>
                        </InputGroup>
                      ) : (
                        // Modo de Visualização Normal
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-bold">{ex.nome}</div>
                            <small className="text-muted">{ex.grupoMuscular} • {ex.tipo}</small>
                          </div>
                          <div>
                            <Button variant="outline-light" size="sm" className="me-2" onClick={() => { setEditandoEx(ex.id); setNovoNome(ex.nome); }}>
                              Editar
                            </Button>
                            <Button variant="outline-danger" size="sm" onClick={() => handleDeleteExercicio(ex.id)}>
                              Deletar
                            </Button>
                          </div>
                        </div>
                      )}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )
            )}
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default PaginaExercicios;