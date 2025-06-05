// src/PaginaDetalhesPlano.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, auth } from './firebase';
import { 
    doc, 
    getDoc, 
    collection, 
    setDoc, 
    query, 
    onSnapshot, 
    orderBy 
} from 'firebase/firestore';

// Imports do React-Bootstrap
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import Spinner from 'react-bootstrap/Spinner';

const PaginaDetalhesPlano = ({ usuario }) => {
  const { planoId } = useParams();
  const [plano, setPlano] = useState(null);
  const [loadingPlano, setLoadingPlano] = useState(true);

  // Estados para Grupos de Treino
  const [gruposDeTreino, setGruposDeTreino] = useState([]);
  const [loadingGrupos, setLoadingGrupos] = useState(true);
  const [nomeNovoGrupo, setNomeNovoGrupo] = useState('');
  const [idNovoGrupo, setIdNovoGrupo] = useState('');
  const [isSubmittingGrupo, setIsSubmittingGrupo] = useState(false);

  // Efeito para buscar os detalhes do plano selecionado (sem mudanças na lógica)
  useEffect(() => {
    if (usuario && planoId) {
      setLoadingPlano(true);
      const planoRef = doc(db, 'usuarios', usuario.uid, 'planosDeTreino', planoId);
      const unsubscribe = onSnapshot(planoRef, (docSnap) => {
        if (docSnap.exists()) {
          setPlano({ id: docSnap.id, ...docSnap.data() });
        } else {
          setPlano(null);
        }
        setLoadingPlano(false);
      }, (error) => { setLoadingPlano(false); });
      return () => unsubscribe();
    } else {
      setLoadingPlano(false); setPlano(null);
    }
  }, [usuario, planoId]);

  // Efeito para buscar os grupos de treino deste plano (sem mudanças na lógica)
  useEffect(() => {
    if (!planoId || !usuario) {
      setLoadingGrupos(false); setGruposDeTreino([]); return;
    }
    setLoadingGrupos(true);
    const gruposColRef = collection(db, 'usuarios', usuario.uid, 'planosDeTreino', planoId, 'definicaoGruposTreino');
    const q = query(gruposColRef, orderBy('ordem', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const listaGrupos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGruposDeTreino(listaGrupos);
      setLoadingGrupos(false);
    }, (error) => { setLoadingGrupos(false); });
    return () => unsubscribe();
  }, [planoId, usuario]);

  // Função para adicionar grupo de treino (sem mudanças na lógica)
  const handleAddGrupoDeTreino = async (e) => {
    e.preventDefault();
    if (!idNovoGrupo.trim() || !nomeNovoGrupo.trim()) {
      alert("Por favor, preencha o ID e o Nome do Grupo.");
      return;
    }
    setIsSubmittingGrupo(true);
    try {
      const gruposColRef = collection(db, 'usuarios', usuario.uid, 'planosDeTreino', planoId, 'definicaoGruposTreino');
      const idFormatado = idNovoGrupo.trim().toUpperCase().replace(/\s+/g, '_');
      const novoGrupoRef = doc(gruposColRef, idFormatado);
      await setDoc(novoGrupoRef, {
        nomeAmigavelGrupo: nomeNovoGrupo.trim(),
        ordem: gruposDeTreino.length + 1, 
        exerciciosPrescritos: [] 
      });
      alert("Grupo de treino adicionado com sucesso!");
      setNomeNovoGrupo(''); setIdNovoGrupo('');
    } catch (error) {
      alert("Falha ao adicionar grupo de treino: " + error.message);
    }
    setIsSubmittingGrupo(false);
  };

  if (loadingPlano) {
    return <div className="text-center mt-5"><Spinner animation="border" /></div>;
  }

  if (!plano) {
    return (
      <div className="text-center mt-5">
        <p>Plano não encontrado.</p>
        <Link to="/meus-planos"><Button variant="secondary">Voltar para Meus Planos</Button></Link>
      </div>
    );
  }

  return (
    <>
      <Row className="align-items-center mb-4">
        <Col>
          <h2 className="mb-0">Detalhes do Plano: <span className="text-primary">{plano.nomePlano}</span></h2>
        </Col>
        <Col xs="auto">
          <Link to="/meus-planos">
            <Button variant="outline-secondary">Voltar para Meus Planos</Button>
          </Link>
        </Col>
      </Row>

      <Row>
        {/* Coluna de Informações do Plano e Formulário de Adicionar Grupo */}
        <Col lg={4} className="mb-4 mb-lg-0">
          <Card data-bs-theme="dark" className="h-100">
            <Card.Body>
              <Card.Title as="h3">Informações</Card.Title>
              <ListGroup variant="flush" className="mb-4">
                <ListGroup.Item>
                  <strong>Início:</strong> {plano.dataInicio && plano.dataInicio.seconds ? new Date(plano.dataInicio.seconds * 1000).toLocaleDateString('pt-BR') : 'N/A'}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Duração:</strong> {plano.totalSemanasCiclo} semanas
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Status:</strong> {plano.ativo ? <span className="text-success">Ativo</span> : <span className="text-muted">Inativo</span>}
                </ListGroup.Item>
              </ListGroup>

              <hr />

              <h4 className="mt-4">Adicionar Novo Grupo</h4>
              <Form onSubmit={handleAddGrupoDeTreino}>
                <Form.Group className="mb-2" controlId="idNovoGrupo">
                  <Form.Label>ID do Grupo</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={idNovoGrupo} 
                    onChange={(e) => setIdNovoGrupo(e.target.value)} 
                    placeholder="Ex: A, B, Peito"
                    required 
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="nomeNovoGrupo">
                  <Form.Label>Nome Amigável</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={nomeNovoGrupo} 
                    onChange={(e) => setNomeNovoGrupo(e.target.value)} 
                    placeholder="Ex: Treino A - Peito e Tríceps"
                    required 
                  />
                </Form.Group>
                <div className="d-grid">
                  <Button type="submit" variant="primary" disabled={isSubmittingGrupo}>
                    {isSubmittingGrupo ? <Spinner as="span" size="sm" /> : 'Adicionar Grupo'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Coluna da Lista de Grupos */}
        <Col lg={8}>
          <Card data-bs-theme="dark" className="h-100">
            <Card.Header as="h3">Grupos de Treino deste Plano</Card.Header>
            {loadingGrupos ? (
              <Card.Body className="text-center"><Spinner animation="border" /></Card.Body>
            ) : (
              gruposDeTreino.length === 0 ? (
                <Card.Body><p className="text-muted">Nenhum grupo de treino cadastrado para este plano ainda.</p></Card.Body>
              ) : (
                <ListGroup variant="flush">
                  {gruposDeTreino.map(grupo => (
                    <ListGroup.Item key={grupo.id} className="d-flex justify-content-between align-items-center">
                      <div className="ms-2 me-auto">
                        <div className="fw-bold">{grupo.nomeAmigavelGrupo}</div>
                        <span className="text-muted">{grupo.exerciciosPrescritos?.length || 0} exercícios prescritos</span>
                      </div>
                      <Link to={`/meus-planos/${planoId}/grupos/${grupo.id}/exercicios`}>
                        <Button variant="outline-light" size="sm">Gerenciar Exercícios</Button>
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

export default PaginaDetalhesPlano;