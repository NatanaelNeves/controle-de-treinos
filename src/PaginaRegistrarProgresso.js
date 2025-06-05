// src/PaginaRegistrarProgresso.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from './firebase';
import { 
    collection, query, where, getDocs, orderBy, doc, onSnapshot, addDoc, serverTimestamp, setDoc, getDoc, arrayUnion, arrayRemove
} from 'firebase/firestore';
import { gerarMensagemEngracada } from './utils/mensagensMotivacionais';
// 1. CORREÇÃO: Adicionado 'Container' à lista de importações
import { Form, Button, Row, Col, Card, Spinner, Alert, Container } from 'react-bootstrap';

const PaginaRegistrarProgresso = ({ usuario }) => {
  const [planoAtivoInfo, setPlanoAtivoInfo] = useState(null);
  const [planoAtivoId, setPlanoAtivoId] = useState('');
  const [semanaCicloSelecionada, setSemanaCicloSelecionada] = useState(1);
  const [gruposDoPlano, setGruposDoPlano] = useState([]);
  const [grupoSelecionadoId, setGrupoSelecionadoId] = useState('');
  
  const [exerciciosPrescritos, setExerciciosPrescritos] = useState([]);
  const [dadosPerformados, setDadosPerformados] = useState({});
  const [observacaoGeralSessao, setObservacaoGeralSessao] = useState('');

  const [loading, setLoading] = useState(true);
  const [loadingExercicios, setLoadingExercicios] = useState(false);
  const [isSubmittingSessao, setIsSubmittingSessao] = useState(false);
  const navigate = useNavigate();

  // Efeito principal para carregar dados do plano e grupos
  useEffect(() => {
    if (!usuario) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const carregarDadosIniciais = async () => {
      try {
        const planosRef = collection(db, 'usuarios', usuario.uid, 'planosDeTreino');
        const qPlanos = query(planosRef, where("ativo", "==", true));
        const planosSnapshot = await getDocs(qPlanos);

        if (planosSnapshot.empty) {
          setPlanoAtivoInfo(null);
          setLoading(false);
          return;
        }
        
        const planoAtivoDoc = planosSnapshot.docs[0];
        const planoData = planoAtivoDoc.data();
        const planoId = planoAtivoDoc.id;
        setPlanoAtivoInfo({ id: planoId, ...planoData });

        if (planoData.dataInicio && planoData.totalSemanasCiclo) {
            const dataInicioPlano = planoData.dataInicio.toDate();
            const hoje = new Date();
            const diffTime = Math.abs(hoje - dataInicioPlano);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            let semanaAtualSugerida = Math.ceil(diffDays / 7);
            semanaAtualSugerida = Math.max(1, Math.min(semanaAtualSugerida, planoData.totalSemanasCiclo));
            setSemanaCicloSelecionada(semanaAtualSugerida);
        }

        const gruposRef = collection(db, 'usuarios', usuario.uid, 'planosDeTreino', planoId, 'definicaoGruposTreino');
        const qGrupos = query(gruposRef, orderBy("ordem", "asc"));
        const gruposSnapshot = await getDocs(qGrupos);
        
        const listaGrupos = gruposSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
        setGruposDoPlano(listaGrupos);

        if (listaGrupos.length > 0) {
          setGrupoSelecionadoId(listaGrupos[0].id);
        } else {
          setGrupoSelecionadoId('');
        }
        
      } catch (error) {
        console.error("Erro ao carregar dados da página:", error);
        setPlanoAtivoInfo(null);
      } finally {
        setLoading(false);
      }
    };
    carregarDadosIniciais();
  }, [usuario]);


  // Efeito para buscar exercícios prescritos quando um grupo é selecionado
  useEffect(() => {
    if (!usuario || !planoAtivoInfo?.id || !grupoSelecionadoId) {
      setExerciciosPrescritos([]); setDadosPerformados({}); return;
    }
    setLoadingExercicios(true);
    const grupoRef = doc(db, 'usuarios', usuario.uid, 'planosDeTreino', planoAtivoInfo.id, 'definicaoGruposTreino', grupoSelecionadoId);
    const unsubscribe = onSnapshot(grupoRef, (docSnap) => {
        if (docSnap.exists()) {
            const prescritos = docSnap.data().exerciciosPrescritos || [];
            setExerciciosPrescritos(prescritos);
            const perfData = {};
            prescritos.forEach(ex => {
            const key = ex.prescricaoId || ex.exercicioBaseId; 
            perfData[key] = {
                exercicioBaseId: ex.exercicioBaseId, nomeExercicioSnapshot: ex.nomeExercicioSnapshot,
                seriesAlvo: ex.seriesAlvo, repsAlvo: ex.repsAlvo,
                cargaKg: '', repsMaxFeitas: '', checkRealizado: true, observacoesExercicio: ''
            };
            });
            setDadosPerformados(perfData);
        } else {
            setExerciciosPrescritos([]); setDadosPerformados({});
        }
        setLoadingExercicios(false);
    }, (error) => {
        console.error("Erro ao buscar exercícios do grupo:", error); setLoadingExercicios(false);
    });
    return () => unsubscribe;
  }, [usuario, planoAtivoInfo, grupoSelecionadoId]);

  const handleInputChange = (prescricaoId, campo, valor) => {
    setDadosPerformados(prev => ({ ...prev, [prescricaoId]: { ...prev[prescricaoId], [campo]: valor } }));
  };

  const handleSalvarSessao = async (e) => {
    e.preventDefault();
    if (!usuario || !planoAtivoInfo || !grupoSelecionadoId || Object.keys(dadosPerformados).length === 0) {
      alert("Informações da sessão incompletas."); return;
    }
    setIsSubmittingSessao(true);
    let maiorCargaNaSessao = 0;
    const exerciciosParaSalvar = Object.values(dadosPerformados).filter(item => item.checkRealizado).map(item => {
        const cargaAtual = parseFloat(item.cargaKg) || 0;
        if (cargaAtual > maiorCargaNaSessao) { maiorCargaNaSessao = cargaAtual; }
        return {
            exercicioBaseId: item.exercicioBaseId, nomeExercicioSnapshot: item.nomeExercicioSnapshot,
            seriesAlvoSnapshot: item.seriesAlvo, repsAlvoSnapshot: item.repsAlvo,
            cargaUtilizadaKg: cargaAtual, repsMaxFeitas: parseInt(item.repsMaxFeitas) || 0,
            checkRealizado: item.checkRealizado, observacoesExercicioSessao: item.observacoesExercicio || ''
        };
    });

    if (exerciciosParaSalvar.length === 0) {
        alert("Nenhum exercício foi marcado como realizado."); setIsSubmittingSessao(false); return;
    }
    try {
        const nomeDoGrupoAtual = gruposDoPlano.find(g=>g.id === grupoSelecionadoId)?.nomeAmigavelGrupo || 'Grupo Desconhecido';
        const faseAtualDoPlano = planoAtivoInfo.fasesDoPlano?.find(f => semanaCicloSelecionada >= f.semanaInicio && semanaCicloSelecionada <= f.semanaFim)?.nomeFase || 'Fase não definida';
        const novaSessaoRef = await addDoc(collection(db, 'usuarios', usuario.uid, 'sessoesRegistradas'), {
            planoId: planoAtivoInfo.id, grupoTreinoId: grupoSelecionadoId, nomeGrupoSnapshot: nomeDoGrupoAtual,
            dataRealizacao: serverTimestamp(), semanaCiclo: semanaCicloSelecionada, faseCicloSnapshot: faseAtualDoPlano,
            exerciciosPerformados: exerciciosParaSalvar, observacaoGeralSessao: observacaoGeralSessao
        });
        let prMessages = [];
        for (const exPerfSalvo of exerciciosParaSalvar) {
            if (exPerfSalvo.cargaUtilizadaKg <= 0) continue;
            const prRef = doc(db, 'usuarios', usuario.uid, 'recordesPessoais', exPerfSalvo.exercicioBaseId);
            const prDoc = await getDoc(prRef); const prData = prDoc.exists() ? prDoc.data() : {};
            const previousMaxCarga = prData.maiorCargaKg || 0;
            if (exPerfSalvo.cargaUtilizadaKg > previousMaxCarga) {
                prMessages.push(`NOVO PR de Carga para ${exPerfSalvo.nomeExercicioSnapshot}: ${exPerfSalvo.cargaUtilizadaKg} kg! 🚀`);
                await setDoc(prRef, { 
                    maiorCargaKg: exPerfSalvo.cargaUtilizadaKg, dataMaiorCarga: new Date(),
                    sessaoIdMaiorCarga: novaSessaoRef.id, nomeExercicioSnapshot: exPerfSalvo.nomeExercicioSnapshot,
                    exercicioBaseId: exPerfSalvo.exercicioBaseId,
                }, { merge: true });
            }
            const recordesPorCarga = prData.recordesPorCarga || [];
            const recordeParaCargaAtual = recordesPorCarga.find(r => r.cargaKg === exPerfSalvo.cargaUtilizadaKg);
            const repsAnterioresParaCarga = recordeParaCargaAtual ? recordeParaCargaAtual.reps : 0;
            if (exPerfSalvo.repsMaxFeitas > repsAnterioresParaCarga) {
                prMessages.push(`NOVO PR de Reps para ${exPerfSalvo.cargaUtilizadaKg}kg em ${exPerfSalvo.nomeExercicioSnapshot}: ${exPerfSalvo.repsMaxFeitas} reps! 🔥`);
                const novosRecordesPorCarga = recordesPorCarga.filter(r => r.cargaKg !== exPerfSalvo.cargaUtilizadaKg);
                novosRecordesPorCarga.push({
                    cargaKg: exPerfSalvo.cargaUtilizadaKg, reps: exPerfSalvo.repsMaxFeitas, data: new Date(), sessaoId: novaSessaoRef.id,
                });
                await setDoc(prRef, { recordesPorCarga: novosRecordesPorCarga }, { merge: true });
            }
        }
        const mensagemMotivacional = gerarMensagemEngracada(maiorCargaNaSessao);
        let finalMessage = `Sessão registrada com sucesso!\n\n${mensagemMotivacional}`;
        if (prMessages.length > 0) {
            finalMessage += "\n\n--- 🏆 RECORDES PESSOAIS ATINGIDOS ---";
            prMessages.forEach(prMsg => { finalMessage += `\n${prMsg}`; });
        }
        alert(finalMessage);
        navigate('/historico');
    } catch (error) {
        console.error("Erro ao salvar ou verificar PRs:", error); alert("Falha ao salvar sessão: " + error.message);
    }
    setIsSubmittingSessao(false);
  };

  if (loading) return <div className="text-center mt-5"><Spinner animation="border" /></div>;
  if (!planoAtivoInfo) return ( 
    <Container className="mt-4">
      <Alert variant="warning" className="text-center">
        <Alert.Heading>Nenhum Plano Ativo!</Alert.Heading>
        <p>Você precisa ter um plano de treino ativo para registrar o progresso. Por favor, vá para "Meus Planos" e ative um.</p>
        <hr />
        <Link to="/meus-planos"><Button variant="warning">Ir para Meus Planos</Button></Link>
      </Alert>
    </Container>
  );

  return (
    <>
      <h2 className="mb-4">Registrar Progresso Semanal</h2>
      <Card data-bs-theme="dark" className="mb-4">
        <Card.Header as="h3">Contexto do Treino</Card.Header>
        <Card.Body>
          <p><strong>Plano Ativo:</strong> {planoAtivoInfo.nomePlano}</p>
          <Row>
            <Col md={6}>
              <Form.Group>
                <Form.Label htmlFor="semanaCiclo">Semana do Ciclo (1 a {planoAtivoInfo.totalSemanasCiclo})</Form.Label>
                <Form.Control 
                  type="number" id="semanaCiclo" value={semanaCicloSelecionada} 
                  onChange={(e) => {
                    const valor = parseInt(e.target.value);
                    const totalSemanas = planoAtivoInfo.totalSemanasCiclo;
                    if (e.target.value === '') { setSemanaCicloSelecionada('');}
                    else if (valor >= 1 && valor <= totalSemanas) { setSemanaCicloSelecionada(valor); }
                    else if (valor < 1) { setSemanaCicloSelecionada(1); }
                    else if (valor > totalSemanas) { setSemanaCicloSelecionada(totalSemanas); }
                  }}
                  min="1" max={planoAtivoInfo.totalSemanasCiclo}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label htmlFor="grupoTreino">Grupo de Treino</Form.Label>
                <Form.Select id="grupoTreino" value={grupoSelecionadoId} onChange={(e) => setGrupoSelecionadoId(e.target.value)} disabled={gruposDoPlano.length === 0}>
                  {loading ? <option>Carregando...</option> : 
                    (gruposDoPlano.length === 0 ? <option value="">Nenhum grupo definido</option> :
                        gruposDoPlano.map(grupo => (
                            <option key={grupo.id} value={grupo.id}>{grupo.nomeAmigavelGrupo}</option>
                        ))
                    )
                  }
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {loadingExercicios ? <div className="text-center"><Spinner animation="border" /></div> : (
        exerciciosPrescritos.length > 0 && grupoSelecionadoId ? (
          <Form onSubmit={handleSalvarSessao}>
            <h3>Exercícios do Grupo: <span className="text-primary">{gruposDoPlano.find(g=>g.id === grupoSelecionadoId)?.nomeAmigavelGrupo}</span></h3>
            {exerciciosPrescritos.map(exPrescrito => {
              const keyId = exPrescrito.prescricaoId || exPrescrito.exercicioBaseId;
              const performanceAtual = dadosPerformados[keyId] || {};
              return (
                <Card key={keyId} className="mb-3" data-bs-theme="dark">
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <Card.Title as="h4" className="mb-0">{exPrescrito.nomeExercicioSnapshot}</Card.Title>
                    <Form.Check type="switch" id={`check-${keyId}`} label="Realizado?"
                      checked={performanceAtual.checkRealizado || false}
                      onChange={(e) => handleInputChange(keyId, 'checkRealizado', e.target.checked)}
                    />
                  </Card.Header>
                  <Card.Body>
                    <Card.Text className="text-muted">
                      Planejado: {exPrescrito.seriesAlvo} séries de {exPrescrito.repsAlvo} reps
                      {exPrescrito.obsPlanejamento && ` | Obs: ${exPrescrito.obsPlanejamento}`}
                    </Card.Text>
                    <Row className="g-2 align-items-end">
                      <Col xs={6} md={3}>
                        <Form.Group><Form.Label>Carga (kg)</Form.Label><Form.Control type="number" step="0.1" placeholder="ex: 80" value={performanceAtual.cargaKg || ''}
                            onChange={(e) => handleInputChange(keyId, 'cargaKg', e.target.value)} /></Form.Group>
                      </Col>
                      <Col xs={6} md={3}>
                        <Form.Group><Form.Label>Reps Máx.</Form.Label><Form.Control type="number" placeholder="ex: 10" value={performanceAtual.repsMaxFeitas || ''}
                            onChange={(e) => handleInputChange(keyId, 'repsMaxFeitas', e.target.value)} /></Form.Group>
                      </Col>
                      <Col xs={12} md={6}>
                         <Form.Group><Form.Label>Obs. do Exercício</Form.Label><Form.Control type="text" placeholder="Ex: Última série foi difícil" value={performanceAtual.observacoesExercicio || ''}
                            onChange={(e) => handleInputChange(keyId, 'observacoesExercicio', e.target.value)} /></Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              );
            })}
            <Card data-bs-theme="dark" className="mt-4">
              <Card.Header as="h4">Resumo da Sessão</Card.Header>
              <Card.Body>
                <Form.Group>
                  <Form.Label>Observações Gerais da Sessão</Form.Label>
                  <Form.Control as="textarea" rows={3} id='obsGeral' value={observacaoGeralSessao}
                      onChange={(e) => setObservacaoGeralSessao(e.target.value)}
                      placeholder='Como se sentiu no treino, energia, etc.' />
                </Form.Group>
                <div className="d-grid mt-3">
                  <Button type="submit" size="lg" variant="success" disabled={isSubmittingSessao}>
                    {isSubmittingSessao ? <><Spinner as="span" size="sm" /> Salvando...</> : 'Finalizar e Salvar Sessão'}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Form>
        ) : (
          grupoSelecionadoId && <Alert variant='info'>Nenhum exercício prescrito para este grupo. Adicione exercícios na tela de "Detalhes do Plano" &gt; "Gerenciar Exercícios".</Alert>
        )
      )}
      <div className="mt-4">
        <Link to="/"><Button variant='secondary'>Voltar ao Dashboard</Button></Link>
      </div>
    </>
  );
};

// 2. CORREÇÃO: Adicionar a linha de export default no final
export default PaginaRegistrarProgresso;