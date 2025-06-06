// src/PaginaRegistrarProgresso.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db, auth } from './firebase';
import { 
    collection, query, where, getDocs, orderBy, doc, onSnapshot, addDoc, serverTimestamp, setDoc, getDoc, arrayUnion, arrayRemove, updateDoc
} from 'firebase/firestore';
import { gerarMensagemEngracada } from './utils/mensagensMotivacionais';
import { Form, Button, Row, Col, Card, Spinner, Alert, InputGroup, Container } from 'react-bootstrap';
import TimerDescanso from './components/TimerDescanso';
import { useToast } from './context/ToastContext'; // 1. IMPORTAR O HOOK useToast

const PaginaRegistrarProgresso = ({ usuario }) => {
  const { showToast } = useToast(); // 2. PEGAR A FUNÇÃO showToast
  const navigate = useNavigate();

  const [planoAtivoInfo, setPlanoAtivoInfo] = useState(null);
  const [semanaCicloSelecionada, setSemanaCicloSelecionada] = useState(1);
  const [gruposDoPlano, setGruposDoPlano] = useState([]);
  const [grupoSelecionadoId, setGrupoSelecionadoId] = useState('');
  
  const [exerciciosPrescritos, setExerciciosPrescritos] = useState([]);
  const [dadosPerformados, setDadosPerformados] = useState({});
  const [observacaoGeralSessao, setObservacaoGeralSessao] = useState('');

  const [loading, setLoading] = useState(true);
  const [loadingExercicios, setLoadingExercicios] = useState(false);
  const [isSubmittingSessao, setIsSubmittingSessao] = useState(false);

  // Efeito principal para carregar dados do plano e grupos
  useEffect(() => {
    if (!usuario) { setLoading(false); return; }
    setLoading(true);
    const carregarDadosIniciais = async () => {
      try {
        const planosRef = collection(db, 'usuarios', usuario.uid, 'planosDeTreino');
        const qPlanos = query(planosRef, where("ativo", "==", true));
        const planosSnapshot = await getDocs(qPlanos);
        if (planosSnapshot.empty) {
          setPlanoAtivoInfo(null); setLoading(false); return;
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
        showToast("Erro ao carregar dados do plano.", 'danger');
        setPlanoAtivoInfo(null);
      } finally {
        setLoading(false);
      }
    };
    carregarDadosIniciais();
  }, [usuario, showToast]);

  // Efeito para buscar exercícios e inicializar estado para MÚLTIPLAS SÉRIES
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
                  observacaoGeralExercicio: '',
                  checkRealizado: true,
                  series: [{ setNumero: 1, cargaKg: '', reps: '', obsSet: '' }] 
              };
            });
            setDadosPerformados(perfData);
        } else {
            setExerciciosPrescritos([]); setDadosPerformados({});
        }
        setLoadingExercicios(false);
    }, (error) => {
        console.error("Erro ao buscar exercícios do grupo:", error);
        showToast("Erro ao carregar exercícios do grupo.", 'danger');
        setLoadingExercicios(false);
    });
    return () => unsubscribe;
  }, [usuario, planoAtivoInfo, grupoSelecionadoId, showToast]);

  const handleSetInputChange = (keyId, setIndex, campo, valor) => {
    const novosDados = { ...dadosPerformados };
    novosDados[keyId].series[setIndex][campo] = valor;
    setDadosPerformados(novosDados);
  };
  
  const handleExercicioInputChange = (keyId, campo, valor) => {
     setDadosPerformados(prev => ({ ...prev, [keyId]: { ...prev[keyId], [campo]: valor } }));
  };

  const handleAddSerie = (keyId) => {
    const novosDados = { ...dadosPerformados };
    const novasSeries = [...novosDados[keyId].series];
    const ultimaSerie = novasSeries[novasSeries.length - 1];
    novasSeries.push({ 
        setNumero: novasSeries.length + 1, 
        cargaKg: ultimaSerie?.cargaKg || '',
        reps: ultimaSerie?.reps || '',
        obsSet: '' 
    });
    novosDados[keyId].series = novasSeries;
    setDadosPerformados(novosDados);
  };

  const handleRemoveSerie = (keyId, setIndex) => {
    const novosDados = { ...dadosPerformados };
    const novasSeries = [...novosDados[keyId].series];
    if (novasSeries.length > 1) {
      novasSeries.splice(setIndex, 1);
      novosDados[keyId].series = novasSeries.map((s, index) => ({ ...s, setNumero: index + 1 }));
      setDadosPerformados(novosDados);
    } else {
      showToast("É necessário registrar pelo menos uma série.", 'warning'); // ALERTA SUBSTITUÍDO
    }
  };

  const handleSalvarSessao = async (e) => {
    e.preventDefault();
    if (!usuario || !planoAtivoInfo || !grupoSelecionadoId || Object.keys(dadosPerformados).length === 0) {
      showToast("Informações da sessão incompletas.", 'danger'); return;
    }
    setIsSubmittingSessao(true);
    let maiorCargaNaSessao = 0;

    const exerciciosPerformadosParaSalvar = Object.values(dadosPerformados)
        .filter(item => item.checkRealizado && item.series.some(s => s.cargaKg && s.reps)) 
        .map(item => {
            const seriesValidas = item.series.filter(s => s.cargaKg && s.reps).map((s, index) => {
                const cargaAtual = parseFloat(s.cargaKg) || 0;
                if (cargaAtual > maiorCargaNaSessao) { maiorCargaNaSessao = cargaAtual; }
                return {
                    setNumero: index + 1, cargaKg: cargaAtual,
                    reps: parseInt(s.reps) || 0, obsSet: s.obsSet || ''
                };
            });
            return {
                exercicioBaseId: item.exercicioBaseId, nomeExercicioSnapshot: item.nomeExercicioSnapshot,
                checkRealizado: item.checkRealizado, observacaoGeralExercicio: item.observacaoGeralExercicio || '',
                series: seriesValidas
            };
    }).filter(item => item.series.length > 0);

    if (exerciciosPerformadosParaSalvar.length === 0) {
        showToast("Nenhum exercício foi marcado como realizado ou teve séries válidas preenchidas.", 'warning'); 
        setIsSubmittingSessao(false); return;
    }
    try {
        const nomeDoGrupoAtual = gruposDoPlano.find(g=>g.id === grupoSelecionadoId)?.nomeAmigavelGrupo || 'Grupo Desconhecido';
        const faseAtualDoPlano = planoAtivoInfo.fasesDoPlano?.find(f => semanaCicloSelecionada >= f.semanaInicio && semanaCicloSelecionada <= f.semanaFim)?.nomeFase || 'Fase não definida';
        const novaSessaoRef = await addDoc(collection(db, 'usuarios', usuario.uid, 'sessoesRegistradas'), {
            planoId: planoAtivoInfo.id, grupoTreinoId: grupoSelecionadoId, nomeGrupoSnapshot: nomeDoGrupoAtual,
            dataRealizacao: serverTimestamp(), semanaCiclo: semanaCicloSelecionada, faseCicloSnapshot: faseAtualDoPlano,
            exerciciosPerformados: exerciciosPerformadosParaSalvar, observacaoGeralSessao: observacaoGeralSessao
        });
        
        let prMessages = [];
        for (const exPerfSalvo of exerciciosPerformadosParaSalvar) {
            const prRef = doc(db, 'usuarios', usuario.uid, 'recordesPessoais', exPerfSalvo.exercicioBaseId);
            const prDoc = await getDoc(prRef); const prData = prDoc.exists() ? prDoc.data() : { maiorCargaKg: 0, recordesPorCarga: [] };
            let novoPrDeCarga = false;
            exPerfSalvo.series.forEach(serie => {
                if (serie.cargaKg > prData.maiorCargaKg) {
                    prData.maiorCargaKg = serie.cargaKg; novoPrDeCarga = true;
                }
                const recordeParaCargaAtual = prData.recordesPorCarga.find(r => r.cargaKg === serie.cargaKg);
                const repsAnteriores = recordeParaCargaAtual ? recordeParaCargaAtual.reps : 0;
                if (serie.reps > repsAnteriores) {
                    prMessages.push(`NOVO PR de Reps para ${serie.cargaKg}kg em ${exPerfSalvo.nomeExercicioSnapshot}: ${serie.reps} reps! 🔥`);
                    const novosRecordesPorCarga = prData.recordesPorCarga.filter(r => r.cargaKg !== serie.cargaKg);
                    novosRecordesPorCarga.push({ cargaKg: serie.cargaKg, reps: serie.reps, data: new Date(), sessaoId: novaSessaoRef.id });
                    prData.recordesPorCarga = novosRecordesPorCarga;
                }
            });
            if (novoPrDeCarga) {
                prMessages.unshift(`NOVO PR de Carga para ${exPerfSalvo.nomeExercicioSnapshot}: ${prData.maiorCargaKg} kg! 🚀`);
                await setDoc(prRef, { 
                    maiorCargaKg: prData.maiorCargaKg, dataMaiorCarga: new Date(),
                    sessaoIdMaiorCarga: novaSessaoRef.id, nomeExercicioSnapshot: exPerfSalvo.nomeExercicioSnapshot,
                    exercicioBaseId: exPerfSalvo.exercicioBaseId, recordesPorCarga: prData.recordesPorCarga
                }, { merge: true });
            } else if (prData.recordesPorCarga.length !== (prDoc.exists() ? prDoc.data().recordesPorCarga?.length || 0 : 0)) {
                await updateDoc(prRef, { recordesPorCarga: prData.recordesPorCarga });
            }
        }
        
        const mensagemMotivacional = gerarMensagemEngracada(maiorCargaNaSessao);
        showToast(mensagemMotivacional, 'success', 6000); // Mostra por 6 segundos
        if (prMessages.length > 0) {
            prMessages.forEach((prMsg, index) => {
                setTimeout(() => { showToast(prMsg, 'warning'); }, (index + 1) * 1500);
            });
        }
        
        setTimeout(() => {
            navigate('/historico');
        }, 1000 + (prMessages.length * 1500));
    } catch (error) {
        console.error("Erro ao salvar ou verificar PRs:", error); 
        showToast("Falha ao salvar sessão: " + error.message, 'danger');
    }
    setIsSubmittingSessao(false);
  };
  
  if (loading) return <div className="text-center mt-5"><Spinner animation="border" /></div>;
  if (!planoAtivoInfo) return ( 
    <Container className="mt-4"><Alert variant="warning" className="text-center">
      <Alert.Heading>Nenhum Plano Ativo!</Alert.Heading>
      <p>Você precisa ter um plano de treino ativo para registrar o progresso. Por favor, vá para "Meus Planos" e ative um.</p><hr />
      <Link to="/meus-planos"><Button variant="warning">Ir para Meus Planos</Button></Link>
    </Alert></Container>
  );

  return (
    <>
      <h2 className="mb-4">Registrar Progresso Semanal</h2>
      <Card data-bs-theme="dark" className="mb-4"><Card.Header as="h3">Contexto do Treino</Card.Header><Card.Body>
        <p><strong>Plano Ativo:</strong> {planoAtivoInfo.nomePlano}</p>
        <Row><Col md={6}><Form.Group>
          <Form.Label htmlFor="semanaCiclo">Semana do Ciclo (1 a {planoAtivoInfo.totalSemanasCiclo})</Form.Label>
          <Form.Control type="number" id="semanaCiclo" value={semanaCicloSelecionada} 
            onChange={(e) => {
              const valor = parseInt(e.target.value); const totalSemanas = planoAtivoInfo.totalSemanasCiclo;
              if (e.target.value === '') { setSemanaCicloSelecionada('');}
              else if (valor >= 1 && valor <= totalSemanas) { setSemanaCicloSelecionada(valor); }
              else if (valor < 1) { setSemanaCicloSelecionada(1); }
              else if (valor > totalSemanas) { setSemanaCicloSelecionada(totalSemanas); }
            }}
            min="1" max={planoAtivoInfo.totalSemanasCiclo}/>
        </Form.Group></Col><Col md={6}><Form.Group>
          <Form.Label htmlFor="grupoTreino">Grupo de Treino</Form.Label>
          <Form.Select id="grupoTreino" value={grupoSelecionadoId} onChange={(e) => setGrupoSelecionadoId(e.target.value)} disabled={gruposDoPlano.length === 0}>
            {loading ? <option>Carregando...</option> : 
              (gruposDoPlano.length === 0 ? <option value="">Nenhum grupo definido</option> :
                  gruposDoPlano.map(grupo => (<option key={grupo.id} value={grupo.id}>{grupo.nomeAmigavelGrupo}</option>))
              )
            }
          </Form.Select>
        </Form.Group></Col></Row>
      </Card.Body></Card>
      
      {loadingExercicios ? <div className="text-center"><Spinner animation="border" /></div> : (
        exerciciosPrescritos.length > 0 && grupoSelecionadoId ? (
          <Form onSubmit={handleSalvarSessao}>
            <h3>Exercícios do Grupo: <span className="text-primary">{gruposDoPlano.find(g=>g.id === grupoSelecionadoId)?.nomeAmigavelGrupo}</span></h3>
            {exerciciosPrescritos.map(exPrescrito => {
              const keyId = exPrescrito.prescricaoId || exPrescrito.exercicioBaseId;
              const performanceAtual = dadosPerformados[keyId];
              return (
                <Card key={keyId} className="mb-3" data-bs-theme="dark">
                  <Card.Header><Form.Check type="switch" id={`check-${keyId}`}
                      label={<span className="fw-bold fs-5">{exPrescrito.nomeExercicioSnapshot}</span>}
                      checked={performanceAtual?.checkRealizado || false}
                      onChange={(e) => handleExercicioInputChange(keyId, 'checkRealizado', e.target.checked)}/>
                  </Card.Header>
                  {performanceAtual?.checkRealizado && (
                    <Card.Body>
                      <small className="text-muted">
                        Planejado: {exPrescrito.seriesAlvo} séries de {exPrescrito.repsAlvo} reps
                        {exPrescrito.obsPlanejamento && ` | Obs: ${exPrescrito.obsPlanejamento}`}
                      </small>
                      <hr className="my-2"/>
                      {performanceAtual.series.map((serie, setIndex) => (
                        <Row key={setIndex} className="g-2 mb-2 align-items-center">
                          <Col xs="auto" className="fw-bold">{`Série ${serie.setNumero}`}</Col>
                          <Col><InputGroup><Form.Control type="number" placeholder="Carga" value={serie.cargaKg} onChange={(e) => handleSetInputChange(keyId, setIndex, 'cargaKg', e.target.value)} /><InputGroup.Text>kg</InputGroup.Text></InputGroup></Col>
                          <Col><InputGroup><Form.Control type="number" placeholder="Reps" value={serie.reps} onChange={(e) => handleSetInputChange(keyId, setIndex, 'reps', e.target.value)} /><InputGroup.Text>reps</InputGroup.Text></InputGroup></Col>
                          <Col xs="auto"><Button variant="outline-danger" size="sm" onClick={() => handleRemoveSerie(keyId, setIndex)}>X</Button></Col>
                        </Row>
                      ))}
                      <Button variant="outline-success" size="sm" onClick={() => handleAddSerie(keyId)}>+ Adicionar Série</Button>
                      <Form.Group className="mt-3">
                        <Form.Control as="textarea" rows={1} placeholder="Observações sobre este exercício..." 
                          value={performanceAtual.observacaoGeralExercicio || ''}
                          onChange={(e) => handleExercicioInputChange(keyId, 'observacaoGeralExercicio', e.target.value)} />
                      </Form.Group>
                    </Card.Body>
                  )}
                </Card>
              );
            })}
            <Card data-bs-theme="dark" className="mt-4">
              <Card.Header as="h4">Resumo da Sessão</Card.Header>
              <Card.Body>
                <Form.Group><Form.Label>Observações Gerais da Sessão</Form.Label>
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
      <div className="mt-4"><Link to="/"><Button variant='secondary'>Voltar ao Dashboard</Button></Link></div>
      
      <TimerDescanso />
    </>
  );
};

export default PaginaRegistrarProgresso;