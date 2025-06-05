// src/PaginaPrincipal.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db, auth } from './firebase';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import Chart from 'react-apexcharts';

// Imports do React-Bootstrap
import { Row, Col, Card, Button, Spinner, ListGroup, Badge } from 'react-bootstrap';
// Imports dos Ícones
import { FaArrowUp, FaArrowDown, FaMinus, FaTrophy } from 'react-icons/fa';

const getYearWeek = (date) => {
  const d = new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNumber = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  return `${d.getFullYear()}-W${weekNumber < 10 ? '0' : ''}${weekNumber}`;
};

const PaginaPrincipal = ({ usuario }) => {
  const [exercicios, setExercicios] = useState([]);
  const [exercicioSelecionadoId, setExercicioSelecionadoId] = useState('');
  
  // Estado para o novo card de evolução
  const [evolutionCardsData, setEvolutionCardsData] = useState([]);
  const [loadingEvolucao, setLoadingEvolucao] = useState(true);
  
  const [chartDataVolumeSemanal, setChartDataVolumeSemanal] = useState({ options: { chart: {id: 'grafico-volume-semanal'}}, series: [] });
  const [loadingVolume, setLoadingVolume] = useState(true);
  
  const [totalSessoesMes, setTotalSessoesMes] = useState(0);
  
  const [recordesPessoais, setRecordesPessoais] = useState([]);
  const [loadingRecordes, setLoadingRecordes] = useState(true);

  // Efeito para buscar a lista de exercícios base do usuário (para o dropdown)
  useEffect(() => {
    if (!usuario) return;
    const q = query(collection(db, "exercicios"), where("userId", "==", usuario.uid), orderBy("nome", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const listaExercicios = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setExercicios(listaExercicios);
        if (listaExercicios.length > 0 && !exercicioSelecionadoId) {
            setExercicioSelecionadoId(listaExercicios[0].id);
        } else if (listaExercicios.length === 0) {
            setLoadingEvolucao(false);
        }
    }, (error) => {
        console.error("Erro ao buscar exercícios:", error);
        setLoadingEvolucao(false);
    });
    return () => unsubscribe();
  }, [usuario, exercicioSelecionadoId]);

  // Efeito para buscar e processar dados para os CARDS DE EVOLUÇÃO
  useEffect(() => {
    if (!usuario || !exercicioSelecionadoId) {
      setLoadingEvolucao(false);
      setEvolutionCardsData([]);
      return;
    }
    setLoadingEvolucao(true);
    const sessoesRef = collection(db, 'usuarios', usuario.uid, 'sessoesRegistradas');
    const qSessoes = query(sessoesRef, orderBy('dataRealizacao', 'asc'));

    const unsubscribe = onSnapshot(qSessoes, (snapshotSessoes) => {
      let performanceHistory = [];
      snapshotSessoes.forEach(docSessao => {
        const sessao = docSessao.data();
        if (sessao.exerciciosPerformados && sessao.dataRealizacao) {
          sessao.exerciciosPerformados.forEach(exPerf => {
            if (exPerf.exercicioBaseId === exercicioSelecionadoId && typeof exPerf.cargaUtilizadaKg === 'number' && exPerf.cargaUtilizadaKg > 0) {
              performanceHistory.push({
                data: new Date(sessao.dataRealizacao.seconds * 1000),
                carga: exPerf.cargaUtilizadaKg,
                reps: exPerf.repsMaxFeitas
              });
            }
          });
        }
      });
      
      let maxCargaAteAgora = 0;
      const cardsData = performanceHistory.map((treinoAtual, index) => {
        const treinoAnterior = index > 0 ? performanceHistory[index - 1] : null;
        const diferenca = treinoAnterior ? treinoAtual.carga - treinoAnterior.carga : 0;
        const isPR = treinoAtual.carga > maxCargaAteAgora;
        if (isPR) { maxCargaAteAgora = treinoAtual.carga; }
        return {
          id: `${treinoAtual.data.getTime()}-${treinoAtual.carga}`,
          data: treinoAtual.data,
          carga: treinoAtual.carga,
          reps: treinoAtual.reps,
          diferenca: diferenca,
          isPR: isPR,
        };
      });

      setEvolutionCardsData(cardsData.reverse());
      setLoadingEvolucao(false);
    }, (error) => { setLoadingEvolucao(false); });

    return () => unsubscribe();
  }, [usuario, exercicioSelecionadoId]);

  // Efeito para buscar dados de VOLUME e SESSÕES NO MÊS
  useEffect(() => {
    if (!usuario) { setLoadingVolume(false); return; }
    setLoadingVolume(true);
    const sessoesRef = collection(db, 'usuarios', usuario.uid, 'sessoesRegistradas');
    const qSessoes = query(sessoesRef, orderBy("dataRealizacao", "asc"));
    const unsubscribe = onSnapshot(qSessoes, (querySnapshot) => {
      const volumesSemanais = {}; let sessoesNoMesAtual = 0;
      const dataAtual = new Date(); const mesAtual = dataAtual.getMonth(); const anoAtual = dataAtual.getFullYear();
      querySnapshot.forEach((doc) => {
        const sessao = doc.data(); let volumeDaSessaoCalculado = 0;
        if (sessao.exerciciosPerformados) {
          sessao.exerciciosPerformados.forEach(exPerf => {
            if (typeof exPerf.cargaUtilizadaKg === 'number' && typeof exPerf.repsMaxFeitas === 'number') {
              volumeDaSessaoCalculado += exPerf.cargaUtilizadaKg * exPerf.repsMaxFeitas;
            }
          });
        }
        if (sessao.dataRealizacao && volumeDaSessaoCalculado > 0) {
          const dataDaSessao = sessao.dataRealizacao.toDate();
          const semanaDoAno = getYearWeek(dataDaSessao);
          volumesSemanais[semanaDoAno] = (volumesSemanais[semanaDoAno] || 0) + volumeDaSessaoCalculado;
        }
        if (sessao.dataRealizacao) {
            const dataDaSessao = sessao.dataRealizacao.toDate();
            if (dataDaSessao.getMonth() === mesAtual && dataDaSessao.getFullYear() === anoAtual) { sessoesNoMesAtual++; }
        }
      });
      setTotalSessoesMes(sessoesNoMesAtual);
      const labelsVolume = Object.keys(volumesSemanais).sort();
      const dataPointsVolume = labelsVolume.map(semana => volumesSemanais[semana]);
      setChartDataVolumeSemanal({
        series: [{ name: 'Volume Total', data: dataPointsVolume }],
        options: { 
            theme: { mode: 'dark', palette: 'palette2' },
            chart: { id: 'grafico-volume-semanal-final', type: 'bar', height: 350, background: 'transparent' },
            xaxis: { categories: labelsVolume, title: { text: 'Semana do Ano (Calendário)' } },
            yaxis: { title: { text: 'Volume Total (Carga x Reps)' }, min: 0 },
            title: { text: 'Volume Total de Treino por Semana (Calendário)', align: 'center' },
            plotOptions: { bar: { horizontal: false, columnWidth: '55%', borderRadius: 5 } },
            dataLabels: { enabled: false }, stroke: { show: true, width: 2, colors: ['transparent'] },
            fill: { opacity: 1 }, tooltip: { theme: 'dark', y: { formatter: function (val) { return val ? val.toFixed(0) + " kg*reps" : "0 kg*reps"; } } },
        }
      });
      setLoadingVolume(false);
    }, (error) => { setLoadingVolume(false); });
    return () => unsubscribe();
  }, [usuario]);
  
  // Efeito exclusivo para buscar os Recordes Pessoais
  useEffect(() => {
    if (!usuario) { setLoadingRecordes(false); setRecordesPessoais([]); return; }
    setLoadingRecordes(true);
    const recordesRef = collection(db, 'usuarios', usuario.uid, 'recordesPessoais');
    const qRecordes = query(recordesRef, orderBy('maiorCargaKg', 'desc'));
    const unsubscribe = onSnapshot(qRecordes, (snapshot) => {
        const listaRecordes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecordesPessoais(listaRecordes);
        setLoadingRecordes(false);
    }, (error) => { console.error("Erro ao buscar recordes:", error); setLoadingRecordes(false); });
    return () => unsubscribe();
  }, [usuario]);

  return (
    <div className="py-4">
      <Row className="text-center mb-4">
        <Col><h1 className="display-5">Dashboard</h1><p className="lead text-muted">Seu painel de controle de treinos.</p></Col>
      </Row>
      <Row className="mb-4 text-center">
        <Col><Link to="/registrar-progresso"><Button variant="success" size="lg" className="shadow">+ Registrar Progresso Semanal</Button></Link></Col>
      </Row>
      <Row className="mb-4 g-4">
        <Col md={12} lg={6} className="d-flex align-items-stretch mb-4 mb-lg-0">
          <Card className="w-100 text-center" data-bs-theme="dark">
            <Card.Body className="d-flex flex-column justify-content-center">
              <Card.Title as="h3" className="h5">Sessões no Mês</Card.Title>
              <p className="display-4 fw-bold text-success">{totalSessoesMes}</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={12} lg={6} className="d-flex align-items-stretch">
          <Card className="w-100 text-center" data-bs-theme="dark">
            <Card.Body className="d-flex flex-column justify-content-center">
              <Card.Title as="h3" className="h5">Maior Carga (1 PR)</Card.Title>
              {loadingRecordes ? <Spinner animation="border" size="sm"/> : (
                <>
                  <p className="display-4 fw-bold text-success">{recordesPessoais[0] ? `${recordesPessoais[0].maiorCargaKg} kg` : '-'}</p>
                  <Card.Subtitle className="text-muted">{recordesPessoais[0] ? `(${recordesPessoais[0].nomeExercicioSnapshot})` : 'Nenhum registro'}</Card.Subtitle>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Card data-bs-theme="dark" className="mb-4">
        <Card.Header as="h3" className="text-center">🏆 Quadro de Recordes Pessoais</Card.Header>
        {loadingRecordes ? (<Card.Body className="text-center"><Spinner animation="border" /></Card.Body>) : (
          recordesPessoais.length === 0 ? (<Card.Body><p className="text-muted text-center">Nenhum recorde registrado ainda.</p></Card.Body>) : (
            <ListGroup variant="flush">
              {recordesPessoais.slice(0, 5).map(pr => (
                <ListGroup.Item key={pr.id} className="d-flex justify-content-between align-items-start">
                  <div className="ms-2 me-auto"><div className="fw-bold fs-5">{pr.nomeExercicioSnapshot}</div><div className="ms-3">
                      <div><strong>Maior Carga:</strong><span className="badge bg-success rounded-pill ms-2 fs-6">{pr.maiorCargaKg} kg</span>
                        <small className="text-muted ms-2">(em {pr.dataMaiorCarga ? new Date(pr.dataMaiorCarga.toDate()).toLocaleDateString('pt-BR') : ''})</small>
                      </div>
                      {pr.recordesPorCarga && pr.recordesPorCarga.length > 0 && (
                        <div className="mt-2"><strong>Melhores Repetições:</strong>
                          <ul className="list-unstyled ms-3">
                            {pr.recordesPorCarga.sort((a,b) => b.cargaKg - a.cargaKg).slice(0, 3).map((repPr, index) => (
                              <li key={index}><span className="badge bg-info text-dark rounded-pill">{repPr.cargaKg} kg x {repPr.reps} reps</span></li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )
        )}
      </Card>
      <Card className="mb-4" data-bs-theme="dark">
        <Card.Header as="h3" className="text-center">Evolução do Exercício</Card.Header>
        <Card.Body>
          <div className="mb-4 text-center">
            <label htmlFor="selectExercicioCarga" className="form-label me-2">Selecione um exercício: </label>
            <select id="selectExercicioCarga" className="form-select w-auto d-inline-block" value={exercicioSelecionadoId} onChange={(e) => setExercicioSelecionadoId(e.target.value)} disabled={exercicios.length === 0 || loadingEvolucao}>
              {exercicios.length === 0 && <option value="">Nenhum exercício cadastrado</option>}
              {exercicios.map(ex => (<option key={ex.id} value={ex.id}>{ex.nome}</option>))}
            </select>
          </div>
          <div className="evolution-timeline">
            {loadingEvolucao ? (<div className="text-center"><Spinner animation="border" size="sm" /></div>) : 
             (evolutionCardsData.length > 0 ? (
                evolutionCardsData.map(treino => (
                  <Card key={treino.id} className="mb-3 bg-dark-subtle">
                    <Card.Body className="d-flex justify-content-between align-items-center p-3">
                      <div>
                        <div className="fw-bold">{treino.data.toLocaleDateString('pt-BR')}</div>
                        <div className="fs-4">{treino.carga} kg <span className="fs-6 text-muted">x {treino.reps} reps</span></div>
                      </div>
                      <div className="text-end">
                        {treino.diferenca > 0 && <Badge bg="success" className="d-block mb-1 fs-6"><FaArrowUp className="me-1"/> +{treino.diferenca.toFixed(1)} kg</Badge>}
                        {treino.diferenca < 0 && <Badge bg="danger" className="d-block mb-1 fs-6"><FaArrowDown className="me-1"/> {treino.diferenca.toFixed(1)} kg</Badge>}
                        {treino.diferenca === 0 && treino.id !== evolutionCardsData[evolutionCardsData.length-1].id && <Badge bg="secondary" className="d-block mb-1 fs-6"><FaMinus className="me-1"/> Manutenção</Badge>}
                        {treino.isPR && <Badge bg="warning" text="dark" className="d-block fs-6"><FaTrophy className="me-1"/> NOVO PR!</Badge>}
                      </div>
                    </Card.Body>
                  </Card>
                ))
              ) : <p className="text-center text-muted">Sem dados de treino para este exercício.</p>)
            }
          </div>
        </Card.Body>
      </Card>
      
      <Card data-bs-theme="dark">
        <Card.Header as="h3" className="text-center">Volume Total Semanal</Card.Header>
        <Card.Body>
          {loadingVolume ? (<p className="text-center text-muted">Carregando...</p>) : (
            chartDataVolumeSemanal.series && chartDataVolumeSemanal.series.length > 0 && chartDataVolumeSemanal.series[0].data.length > 0 ?
            <Chart options={chartDataVolumeSemanal.options} series={chartDataVolumeSemanal.series} type="bar" height={350}/>
            : <p className="text-center text-muted">Sem dados de volume para exibir.</p>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default PaginaPrincipal;