// src/PaginaHistorico.js
import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase'; // auth é pego da prop usuario
import { collection, query, where, onSnapshot, orderBy, getDocs } from 'firebase/firestore';

// Imports do React-Bootstrap
import { Row, Col, Card, Form, Button, Table, Modal, Spinner, Alert, Badge } from 'react-bootstrap'; // Adicionado Table
import { FaArrowUp, FaArrowDown, FaMinus, FaTrophy } from 'react-icons/fa'; // Ícones para o futuro, se quisermos

const PaginaHistorico = ({ usuario }) => {
  const [sessoesDeTreino, setSessoesDeTreino] = useState([]);
  const [sessoesFiltradas, setSessoesFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filtroMesAno, setFiltroMesAno] = useState('');
  const [listaExerciciosBase, setListaExerciciosBase] = useState([]);
  const [filtroExercicioId, setFiltroExercicioId] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [sessaoSelecionada, setSessaoSelecionada] = useState(null);

  const handleVerDetalhes = (sessao) => {
    setSessaoSelecionada(sessao);
    setShowModal(true);
  };
  const handleFecharModal = () => setShowModal(false);

  // useEffect para buscar exercícios base para o filtro (sem mudanças)
  useEffect(() => {
    if (!usuario) return;
    const fetchExerciciosBase = async () => {
      const q = query(collection(db, "exercicios"), where("userId", "==", usuario.uid), orderBy("nome", "asc"));
      try {
        const querySnapshot = await getDocs(q);
        setListaExerciciosBase(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) { console.error("Erro ao buscar exercícios base:", error); }
    };
    fetchExerciciosBase();
  }, [usuario]);

  // useEffect para buscar sessões de treino (sem mudanças)
  useEffect(() => {
    if (!usuario) { setLoading(false); setSessoesDeTreino([]); return; }
    setLoading(true);
    const sessoesRef = collection(db, 'usuarios', usuario.uid, 'sessoesRegistradas');
    const q = query(sessoesRef, orderBy("dataRealizacao", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setSessoesDeTreino(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => { console.error("Erro ao buscar histórico:", error); setLoading(false); });
    return () => unsubscribe();
  }, [usuario]);

  // useEffect para aplicar filtros (sem mudanças)
  useEffect(() => {
    let sessoesProcessadas = [...sessoesDeTreino];
    if (filtroMesAno) { /* ... lógica de filtro de mês ... */ }
    if (filtroExercicioId) { /* ... lógica de filtro de exercício ... */ }
    setSessoesFiltradas(sessoesProcessadas);
  }, [sessoesDeTreino, filtroMesAno, filtroExercicioId]);


  if (loading) return <div className="text-center mt-5"><Spinner animation="border" /></div>;

  return (
    <>
      <h2 className="mb-4">Histórico de Sessões de Treino</h2>
      
      {/* Controles de Filtro (sem mudanças no JSX) */}
      <Card data-bs-theme="dark" className="mb-4">
        {/* ... seu código dos filtros ... */}
      </Card>
      
      {/* Tabela Principal (sem mudanças no JSX) */}
      <div className="table-responsive">
        <Table striped bordered hover variant="dark">
          {/* ... thead da tabela ... */}
          <tbody>
            {sessoesFiltradas.length === 0 ? (
              <tr><td colSpan="6" className="text-center text-muted py-4">Nenhuma sessão encontrada.</td></tr>
            ) : (
              sessoesFiltradas.map(sessao => (
                <tr key={sessao.id}>
                  {/* ... tds da tabela ... */}
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

      {/* MODAL DE DETALHES ATUALIZADO */}
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
              {sessaoSelecionada.observacaoGeralSessao && <p><strong>Obs. Geral da Sessão:</strong> {sessaoSelecionada.observacaoGeralSessao}</p>}
              <hr />
              <h6>Exercícios Performados:</h6>
              {sessaoSelecionada.exerciciosPerformados?.length > 0 ? (
                sessaoSelecionada.exerciciosPerformados.map((ex, index) => (
                  <Card key={ex.exercicioBaseId + '_' + index} className="mb-2 bg-dark-subtle text-light">
                    <Card.Body>
                      <Card.Title as="h6">{ex.nomeExercicioSnapshot}</Card.Title>
                      {ex.observacaoGeralExercicio && <Card.Subtitle className="mb-2 text-muted fst-italic">"{ex.observacaoGeralExercicio}"</Card.Subtitle>}
                      
                      {/* LÓGICA ATUALIZADA: Verifica se existe o array 'series' */}
                      {ex.series && ex.series.length > 0 ? (
                        <Table striped size="sm" variant="dark" responsive>
                          <thead>
                            <tr>
                              <th>Série</th>
                              <th>Carga (kg)</th>
                              <th>Reps</th>
                              <th>Obs. da Série</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ex.series.map((serie, serieIndex) => (
                              <tr key={serieIndex}>
                                <td>{serie.setNumero}</td>
                                <td>{serie.cargaKg}</td>
                                <td>{serie.reps}</td>
                                <td>{serie.obsSet || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      ) : (
                        // Fallback para exibir dados da estrutura antiga (resumo)
                        <p>
                          <strong>Realizado:</strong> {ex.cargaUtilizadaKg} kg x {ex.repsMaxFeitas} reps
                        </p>
                      )}
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