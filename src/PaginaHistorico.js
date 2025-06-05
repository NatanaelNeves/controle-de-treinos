// src/PaginaHistorico.js
import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, where, onSnapshot, orderBy, getDocs } from 'firebase/firestore';

// 1. IMPORTAR COMPONENTES DO REACT-BOOTSTRAP
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table'; // Para a tabela
import Modal from 'react-bootstrap/Modal'; // Para o modal de detalhes
import Spinner from 'react-bootstrap/Spinner';

const PaginaHistorico = ({ usuario }) => {
  const [sessoesDeTreino, setSessoesDeTreino] = useState([]);
  const [sessoesFiltradas, setSessoesFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filtroMesAno, setFiltroMesAno] = useState('');
  const [listaExerciciosBase, setListaExerciciosBase] = useState([]);
  const [filtroExercicioId, setFiltroExercicioId] = useState('');
  
  // Estado para o Modal: em vez de um objeto, agora controlamos apenas a visibilidade e qual sessão mostrar
  const [showModal, setShowModal] = useState(false);
  const [sessaoSelecionada, setSessaoSelecionada] = useState(null);

  // Lógica para abrir e fechar o modal
  const handleVerDetalhes = (sessao) => {
    setSessaoSelecionada(sessao);
    setShowModal(true);
  };
  const handleFecharModal = () => setShowModal(false);

  // useEffect para buscar exercícios base (sem mudanças na lógica)
  useEffect(() => {
    if (!usuario) return;
    const fetchExerciciosBase = async () => {
      const q = query(collection(db, "exercicios"), where("userId", "==", usuario.uid), orderBy("nome", "asc"));
      try {
        const querySnapshot = await getDocs(q);
        const lista = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setListaExerciciosBase(lista);
      } catch (error) {
        console.error("Erro ao buscar exercícios base para filtro: ", error);
      }
    };
    fetchExerciciosBase();
  }, [usuario]);

  // useEffect para buscar as sessões de treino (sem mudanças na lógica)
  useEffect(() => {
    if (!usuario) { setLoading(false); setSessoesDeTreino([]); return; }
    setLoading(true);
    const sessoesRef = collection(db, 'usuarios', usuario.uid, 'sessoesRegistradas');
    const q = query(sessoesRef, orderBy("dataRealizacao", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const listaSessoes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSessoesDeTreino(listaSessoes);
      setLoading(false);
    }, (error) => { console.error("Erro ao buscar histórico:", error); setLoading(false); });
    return () => unsubscribe();
  }, [usuario]);

  // useEffect para aplicar filtros (sem mudanças na lógica)
  useEffect(() => {
    let sessoesProcessadas = [...sessoesDeTreino];
    if (filtroMesAno) {
      sessoesProcessadas = sessoesProcessadas.filter(sessao => {
        if (!sessao.dataRealizacao?.seconds) return false;
        const dataSessao = new Date(sessao.dataRealizacao.seconds * 1000);
        const mesAnoDaSessao = `${dataSessao.getFullYear()}-${(dataSessao.getMonth() + 1).toString().padStart(2, '0')}`;
        return mesAnoDaSessao === filtroMesAno;
      });
    }
    if (filtroExercicioId) {
      sessoesProcessadas = sessoesProcessadas.filter(sessao =>
        sessao.exerciciosPerformados?.some(exPerf => exPerf.exercicioBaseId === filtroExercicioId)
      );
    }
    setSessoesFiltradas(sessoesProcessadas);
  }, [sessoesDeTreino, filtroMesAno, filtroExercicioId]);

  if (loading) {
    return <div className="text-center mt-5"><Spinner animation="border" /></div>;
  }

  return (
    <>
      <h2 className="mb-4">Histórico de Sessões de Treino</h2>
      
      {/* Controles de Filtro dentro de um Card */}
      <Card data-bs-theme="dark" className="mb-4">
        <Card.Body>
          <Form>
            <Row className="align-items-end g-3">
              <Col md>
                <Form.Group controlId="filtroExercicioEspecifico">
                  <Form.Label>Filtrar por Exercício</Form.Label>
                  <Form.Select value={filtroExercicioId} onChange={(e) => setFiltroExercicioId(e.target.value)}>
                    <option value="">Todos os Exercícios</option>
                    {listaExerciciosBase.map(ex => (
                      <option key={ex.id} value={ex.id}>{ex.nome}</option> 
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md>
                <Form.Group controlId="filtroMesAno">
                  <Form.Label>Filtrar por Mês/Ano</Form.Label>
                  <Form.Control type="month" value={filtroMesAno} onChange={(e) => setFiltroMesAno(e.target.value)} />
                </Form.Group>
              </Col>
              <Col xs="auto">
                <Button variant="outline-secondary" onClick={() => { setFiltroExercicioId(''); setFiltroMesAno(''); }}>
                  Limpar Filtros
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
      
      {/* Tabela Responsiva */}
      <div className="table-responsive">
        <Table striped bordered hover variant="dark">
          <thead>
            <tr>
              <th>Data da Sessão</th>
              <th>Grupo Treinado</th>
              <th>Semana do Ciclo</th>
              <th>Nº de Exercícios</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {sessoesFiltradas.length === 0 ? (
              <tr><td colSpan="5" className="text-center text-muted py-4">Nenhuma sessão encontrada.</td></tr>
            ) : (
              sessoesFiltradas.map(sessao => (
                <tr key={sessao.id}>
                  <td>{sessao.dataRealizacao ? new Date(sessao.dataRealizacao.seconds * 1000).toLocaleDateString('pt-BR') : 'N/A'}</td>
                  <td>{sessao.nomeGrupoSnapshot || '-'}</td>
                  <td>{sessao.semanaCiclo || '-'}</td>
                  <td>{sessao.exerciciosPerformados?.length || 0}</td>
                  <td>
                    <Button variant="outline-light" size="sm" onClick={() => handleVerDetalhes(sessao)}>Ver Detalhes</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* MODAL DE DETALHES DO REACT-BOOTSTRAP */}
      <Modal show={showModal} onHide={handleFecharModal} centered size="lg" data-bs-theme="dark">
        <Modal.Header closeButton>
          <Modal.Title>Detalhes da Sessão</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {sessaoSelecionada && (
            <div>
              <h5>{sessaoSelecionada.nomeGrupoSnapshot} - Semana {sessaoSelecionada.semanaCiclo}</h5>
              <p className="text-muted">
                Data: {sessaoSelecionada.dataRealizacao ? new Date(sessaoSelecionada.dataRealizacao.seconds * 1000).toLocaleDateString('pt-BR') : 'N/A'}
              </p>
              {sessaoSelecionada.observacaoGeralSessao && <p><strong>Obs. da Sessão:</strong> {sessaoSelecionada.observacaoGeralSessao}</p>}
              <hr />
              <h6>Exercícios Performados:</h6>
              {sessaoSelecionada.exerciciosPerformados?.length > 0 ? (
                sessaoSelecionada.exerciciosPerformados.map((ex, index) => (
                  <Card key={ex.exercicioBaseId + '_' + index} className="mb-2">
                    <Card.Body>
                      <Card.Title as="h6">{ex.nomeExercicioSnapshot}</Card.Title>
                      <Card.Text as="div">
                        <small className="text-muted">Planejado: {ex.seriesAlvoSnapshot || '?'} séries de {ex.repsAlvoSnapshot || '?'} reps</small>
                        <div><strong>Realizado:</strong> {ex.cargaUtilizadaKg} kg x {ex.repsMaxFeitas} reps</div>
                        {ex.observacoesExercicioSessao && <div className="small"><em>Obs: {ex.observacoesExercicioSessao}</em></div>}
                      </Card.Text>
                    </Card.Body>
                  </Card>
                ))
              ) : <p>Nenhum exercício detalhado nesta sessão.</p>}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleFecharModal}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default PaginaHistorico;