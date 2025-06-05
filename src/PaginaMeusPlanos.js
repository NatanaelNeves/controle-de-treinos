// src/PaginaMeusPlanos.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db, auth } from './firebase';
import { 
  collection, addDoc, query, where, onSnapshot, serverTimestamp, 
  writeBatch, getDocs, doc, orderBy 
} from 'firebase/firestore';

// Imports do React-Bootstrap
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import Spinner from 'react-bootstrap/Spinner'; // Para um loading mais elegante

const PaginaMeusPlanos = ({ usuario }) => {
  const [planos, setPlanos] = useState([]);
  const [loadingPlanos, setLoadingPlanos] = useState(true);

  // Estados do formulário
  const [nomePlano, setNomePlano] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [totalSemanasCiclo, setTotalSemanasCiclo] = useState(12);
  const [ativo, setAtivo] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // useEffect para buscar planos existentes (sem mudanças na lógica)
  useEffect(() => {
    if (!usuario) { setLoadingPlanos(false); setPlanos([]); return; }
    setLoadingPlanos(true);
    const planosColRef = collection(db, 'usuarios', usuario.uid, 'planosDeTreino');
    const q = query(planosColRef, orderBy('dataCriacao', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const listaPlanos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPlanos(listaPlanos);
      setLoadingPlanos(false);
    }, (error) => { console.error("Erro ao buscar planos:", error); setLoadingPlanos(false); });
    return () => unsubscribe();
  }, [usuario]);

  // handleAddPlano (sem mudanças na lógica)
  const handleAddPlano = async (e) => {
    e.preventDefault();
    if (!nomePlano.trim() || !dataInicio || !totalSemanasCiclo) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    if (parseInt(totalSemanasCiclo) <= 0) {
      alert("O total de semanas deve ser maior que zero.");
      return;
    }
    setIsSubmitting(true);
    try {
      const planosColRef = collection(db, 'usuarios', usuario.uid, 'planosDeTreino');
      const batch = writeBatch(db);
      if (ativo) {
        const qPlanosAtivos = query(planosColRef, where("ativo", "==", true));
        const snapshotPlanosAtivos = await getDocs(qPlanosAtivos);
        snapshotPlanosAtivos.forEach(docSnapshot => {
          batch.update(doc(db, 'usuarios', usuario.uid, 'planosDeTreino', docSnapshot.id), { ativo: false });
        });
      }
      const novoPlanoData = {
        nomePlano: nomePlano.trim(),
        dataInicio: new Date(dataInicio),
        totalSemanasCiclo: parseInt(totalSemanasCiclo),
        ativo,
        userId: usuario.uid,
        dataCriacao: serverTimestamp()
      };
      const novoPlanoRef = doc(planosColRef);
      batch.set(novoPlanoRef, novoPlanoData);
      await batch.commit();
      alert("Plano de treino adicionado com sucesso!");
      setNomePlano(''); setDataInicio(''); setTotalSemanasCiclo(12); setAtivo(true);
    } catch (error) {
      console.error("Erro ao adicionar plano: ", error);
      alert("Falha ao adicionar plano: " + error.message);
    }
    setIsSubmitting(false);
  };

  return (
    // O Container já vem do App.js, então usamos Row e Col diretamente
    <>
      <h2 className="mb-4">Meus Planos de Treino</h2>
      <Row>
        {/* Coluna do Formulário */}
        <Col md={5} lg={4} className="mb-4 mb-md-0">
          <Card data-bs-theme="dark" className="h-100">
            <Card.Body>
              <Card.Title as="h3">Criar Novo Plano</Card.Title>
              <Form onSubmit={handleAddPlano}>
                <Form.Group className="mb-3" controlId="nomePlano">
                  <Form.Label>Nome do Plano</Form.Label>
                  <Form.Control type="text" value={nomePlano} onChange={(e) => setNomePlano(e.target.value)} required />
                </Form.Group>
                <Form.Group className="mb-3" controlId="dataInicio">
                  <Form.Label>Data de Início</Form.Label>
                  <Form.Control type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} required />
                </Form.Group>
                <Form.Group className="mb-3" controlId="totalSemanas">
                  <Form.Label>Total de Semanas no Ciclo</Form.Label>
                  <Form.Control type="number" value={totalSemanasCiclo} onChange={(e) => setTotalSemanasCiclo(e.target.value)} min="1" required />
                </Form.Group>
                <Form.Check 
                  type="switch"
                  id="plano-ativo-switch"
                  label="Marcar como plano ativo?"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                  className="mb-3"
                />
                <div className="d-grid">
                  <Button variant="primary" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Spinner as="span" animation="border" size="sm" /> : "Salvar Plano"}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Coluna da Lista de Planos */}
        <Col md={7} lg={8}>
          <Card data-bs-theme="dark">
            <Card.Header as="h3">Planos Existentes</Card.Header>
            {loadingPlanos ? (
              <Card.Body className="text-center">
                <Spinner animation="border" />
              </Card.Body>
            ) : (
              planos.length === 0 ? (
                <Card.Body>
                  <p className="text-muted">Nenhum plano cadastrado ainda.</p>
                </Card.Body>
              ) : (
                <ListGroup variant="flush">
                  {planos.map(plano => (
                    <ListGroup.Item key={plano.id} className="d-flex justify-content-between align-items-start">
                      <div className="ms-2 me-auto">
                        <div className="fw-bold">{plano.nomePlano}</div>
                        Início: {plano.dataInicio && plano.dataInicio.seconds ? new Date(plano.dataInicio.seconds * 1000).toLocaleDateString('pt-BR') : 'N/A'}
                        {' | '}
                        Duração: {plano.totalSemanasCiclo} semanas
                      </div>
                      {plano.ativo && <span className="badge bg-success rounded-pill align-self-center me-2">Ativo</span>}
                      <Link to={`/meus-planos/${plano.id}`}>
                        <Button variant="outline-light" size="sm">Detalhes</Button>
                      </Link>
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

export default PaginaMeusPlanos;