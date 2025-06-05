// src/PaginaGerenciarExerciciosGrupo.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, auth } from './firebase';
import {
    doc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    collection,
    query,
    where,
    getDocs,
    onSnapshot,
    orderBy // <<< 1. 'orderBy' ADICIONADO AQUI
} from 'firebase/firestore';

// Imports do React-Bootstrap
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';

const PaginaGerenciarExerciciosGrupo = ({ usuario }) => {
  const { planoId, grupoId } = useParams();
  const [grupoInfo, setGrupoInfo] = useState(null);
  const [exerciciosPrescritos, setExerciciosPrescritos] = useState([]);
  
  // 2. CORREÇÃO DO NOME DO ESTADO DE LOADING
  const [loadingGrupo, setLoadingGrupo] = useState(true);

  const [exerciciosBaseDisponiveis, setExerciciosBaseDisponiveis] = useState([]);
  const [loadingExerciciosBase, setLoadingExerciciosBase] = useState(true);

  // Estados do formulário
  const [exercicioBaseSelecionadoId, setExercicioBaseSelecionadoId] = useState('');
  const [seriesAlvo, setSeriesAlvo] = useState('3-4');
  const [repsAlvo, setRepsAlvo] = useState('8-12');
  const [obsPlanejamento, setObsPlanejamento] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buscar informações do grupo e seus exercícios prescritos
  useEffect(() => {
    if (usuario && planoId && grupoId) {
      setLoadingGrupo(true);
      const grupoRef = doc(db, 'usuarios', usuario.uid, 'planosDeTreino', planoId, 'definicaoGruposTreino', grupoId);
      const unsubscribe = onSnapshot(grupoRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setGrupoInfo({ id: docSnap.id, ...data });
          setExerciciosPrescritos(data.exerciciosPrescritos || []);
        } else {
          setGrupoInfo(null);
        }
        setLoadingGrupo(false);
      }, (error) => {
        console.error("Erro ao buscar grupo:", error);
        setLoadingGrupo(false);
      });
      return () => unsubscribe();
    } else {
        setLoadingGrupo(false); // Garante que o loading pare se não houver dados
    }
  }, [usuario, planoId, grupoId]);

  // Buscar todos os exercícios base do usuário para o dropdown
  useEffect(() => {
    if (usuario) {
      setLoadingExerciciosBase(true);
      const fetchExerciciosBase = async () => {
        // Usando a coleção 'exercicios' e o campo 'userId' que já sabemos que funciona
        const q = query(collection(db, "exercicios"), where("userId", "==", usuario.uid), orderBy("nome", "asc"));
        try {
          const querySnapshot = await getDocs(q);
          const lista = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setExerciciosBaseDisponiveis(lista);
        } catch (error) {
          console.error("Erro ao buscar exercícios base:", error);
        } finally {
          setLoadingExerciciosBase(false);
        }
      };
      fetchExerciciosBase();
    }
  }, [usuario]);

  const handleAddExercicioPrescrito = async (e) => {
    e.preventDefault();
    if (!exercicioBaseSelecionadoId) {
      alert("Por favor, selecione um exercício da lista.");
      return;
    }
    setIsSubmitting(true);

    const exercicioSelecionadoInfo = exerciciosBaseDisponiveis.find(ex => ex.id === exercicioBaseSelecionadoId);
    if (!exercicioSelecionadoInfo) {
      alert("Erro: Exercício base selecionado não encontrado.");
      setIsSubmitting(false);
      return;
    }

    const novoExercicioPrescrito = {
      exercicioBaseId: exercicioBaseSelecionadoId,
      nomeExercicioSnapshot: exercicioSelecionadoInfo.nome, // Usando 'nome' que é o campo correto
      seriesAlvo: seriesAlvo.trim(),
      repsAlvo: repsAlvo.trim(),
      obsPlanejamento: obsPlanejamento.trim(),
      prescricaoId: doc(collection(db, '_')).id
    };

    try {
      const grupoRef = doc(db, 'usuarios', usuario.uid, 'planosDeTreino', planoId, 'definicaoGruposTreino', grupoId);
      await updateDoc(grupoRef, {
        exerciciosPrescritos: arrayUnion(novoExercicioPrescrito)
      });
      alert("Exercício adicionado ao grupo!");
      setExercicioBaseSelecionadoId('');
      setSeriesAlvo('3-4');
      setRepsAlvo('8-12');
      setObsPlanejamento('');
    } catch (error) {
      console.error("Erro ao adicionar exercício ao grupo: ", error);
      alert("Falha ao adicionar exercício: " + error.message);
    }
    setIsSubmitting(false);
  };
  
  const handleRemoveExercicioPrescrito = async (prescricaoParaRemover) => {
    if (!window.confirm(`Tem certeza que quer remover "${prescricaoParaRemover.nomeExercicioSnapshot}" do grupo?`)) return;
    try {
        const grupoRef = doc(db, 'usuarios', usuario.uid, 'planosDeTreino', planoId, 'definicaoGruposTreino', grupoId);
        await updateDoc(grupoRef, {
            exerciciosPrescritos: arrayRemove(prescricaoParaRemover)
        });
        alert("Exercício removido do grupo.");
    } catch (error) {
        console.error("Erro ao remover exercício: ", error);
        alert("Erro ao remover exercício: " + error.message);
    }
  };

  if (loadingGrupo) {
    return <div className="text-center mt-5"><Spinner animation="border" /></div>;
  }

  if (!grupoInfo) {
    return (
      <div className="text-center mt-5">
        <Alert variant="danger">Grupo de treino não encontrado.</Alert>
        <Link to={planoId ? `/meus-planos/${planoId}` : "/meus-planos"}>
            <Button variant="secondary">Voltar</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <Row className="align-items-center mb-4">
        <Col>
          <h2 className="mb-0">Gerenciar Exercícios: <span className="text-success">{grupoInfo.nomeAmigavelGrupo}</span></h2>
        </Col>
        <Col xs="auto">
          <Link to={`/meus-planos/${planoId}`}>
            <Button variant="outline-secondary">Voltar aos Detalhes do Plano</Button>
          </Link>
        </Col>
      </Row>

      <Row>
        {/* Coluna do Formulário */}
        <Col lg={5} className="mb-4 mb-lg-0">
          <Card data-bs-theme="dark" className="h-100">
            <Card.Body>
              <Card.Title as="h3">Adicionar Exercício Prescrito</Card.Title>
              <Form onSubmit={handleAddExercicioPrescrito}>
                <Form.Group className="mb-3" controlId="exercicioBase">
                  <Form.Label>Exercício Base</Form.Label>
                  <Form.Select 
                    value={exercicioBaseSelecionadoId} 
                    onChange={(e) => setExercicioBaseSelecionadoId(e.target.value)} 
                    disabled={loadingExerciciosBase}
                    required
                  >
                    <option value="">{loadingExerciciosBase ? 'Carregando...' : (exerciciosBaseDisponiveis.length === 0 ? "Nenhum exercício cadastrado" : "Selecione...")}</option>
                    {exerciciosBaseDisponiveis.map(ex => (
                      <option key={ex.id} value={ex.id}>{ex.nome}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3" controlId="seriesAlvo">
                  <Form.Label>Séries Alvo</Form.Label>
                  <Form.Control type="text" value={seriesAlvo} onChange={(e) => setSeriesAlvo(e.target.value)} placeholder="Ex: 3-4 ou 4" />
                </Form.Group>
                <Form.Group className="mb-3" controlId="repsAlvo">
                  <Form.Label>Repetições Alvo</Form.Label>
                  <Form.Control type="text" value={repsAlvo} onChange={(e) => setRepsAlvo(e.target.value)} placeholder="Ex: 8-12 ou 10" />
                </Form.Group>
                <Form.Group className="mb-3" controlId="obsPlanejamento">
                  <Form.Label>Observações do Planejamento</Form.Label>
                  <Form.Control as="textarea" rows={2} value={obsPlanejamento} onChange={(e) => setObsPlanejamento(e.target.value)} placeholder="Ex: Focar na fase excêntrica" />
                </Form.Group>
                <div className="d-grid">
                  <Button type="submit" variant="primary" disabled={isSubmitting}>
                    {isSubmitting ? <Spinner as="span" size="sm" /> : 'Adicionar ao Grupo'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Coluna da Lista de Exercícios Prescritos */}
        <Col lg={7}>
          <Card data-bs-theme="dark" className="h-100">
            <Card.Header as="h3">Exercícios Prescritos neste Grupo ({exerciciosPrescritos.length})</Card.Header>
            {/* 3. CORREÇÃO DE LÓGICA DE LOADING */}
            {loadingGrupo ? (
              <Card.Body className="text-center"><Spinner animation="border" /></Card.Body>
            ) : (
              exerciciosPrescritos.length === 0 ? (
                <Card.Body><p className="text-muted">Nenhum exercício prescrito para este grupo ainda.</p></Card.Body>
              ) : (
                <ListGroup variant="flush">
                  {exerciciosPrescritos.map((ex) => (
                    <ListGroup.Item key={ex.prescricaoId} className="d-flex justify-content-between align-items-center">
                      <div className="ms-2 me-auto">
                        <div className="fw-bold">{ex.nomeExercicioSnapshot}</div>
                        Séries: {ex.seriesAlvo} | Reps: {ex.repsAlvo}
                        {ex.obsPlanejamento && <div className="text-muted small mt-1">Obs: {ex.obsPlanejamento}</div>}
                      </div>
                      <Button variant="outline-danger" size="sm" onClick={() => handleRemoveExercicioPrescrito(ex)}>
                        Remover
                      </Button>
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

export default PaginaGerenciarExerciciosGrupo;