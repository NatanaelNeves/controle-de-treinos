// src/PaginaPrincipal.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db, auth } from './firebase';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import Chart from 'react-apexcharts';
import { Row, Col, Card, Button, Spinner, ListGroup } from 'react-bootstrap';

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
  const [chartDataCarga, setChartDataCarga] = useState({ options: { chart: {id: 'grafico-evolucao-carga'}}, series: [] });
  const [loadingCarga, setLoadingCarga] = useState(true);
  const [chartDataVolumeSemanal, setChartDataVolumeSemanal] = useState({ options: { chart: {id: 'grafico-volume-semanal'}}, series: [] });
  const [loadingVolume, setLoadingVolume] = useState(true);
  const [totalSessoesMes, setTotalSessoesMes] = useState(0);
  const [recordesPessoais, setRecordesPessoais] = useState([]);
  const [loadingRecordes, setLoadingRecordes] = useState(true);

  // Efeito para buscar a lista de exercícios base do usuário
  useEffect(() => {
    if (!usuario) return;
    const q = query(collection(db, "exercicios"), where("userId", "==", usuario.uid), orderBy("nome", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const listaExercicios = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setExercicios(listaExercicios);
        if (listaExercicios.length > 0 && !exercicioSelecionadoId) {
            setExercicioSelecionadoId(listaExercicios[0].id);
        } else if (listaExercicios.length === 0) {
            setLoadingCarga(false);
        }
    }, (error) => console.error("Erro ao buscar exercícios:", error));
    return () => unsubscribe();
  }, [usuario, exercicioSelecionadoId]);

  // Efeito para buscar dados de CARGA
  useEffect(() => {
    if (!usuario || !exercicioSelecionadoId) {
      setLoadingCarga(false);
      setChartDataCarga({ series: [], options: { chart: {id: 'grafico-evolucao-carga-vazio'}, title: { text: 'Selecione um exercício para ver a evolução da carga.'}}});
      return;
    }
    setLoadingCarga(true);
    const sessoesRef = collection(db, 'usuarios', usuario.uid, 'sessoesRegistradas');
    const qSessoes = query(sessoesRef, orderBy('dataRealizacao', 'asc'));
    const unsubscribe = onSnapshot(qSessoes, (snapshotSessoes) => {
      const cargaDataPoints = [];
      snapshotSessoes.forEach(docSessao => {
        const sessao = docSessao.data();
        if (sessao.exerciciosPerformados && sessao.dataRealizacao) {
          sessao.exerciciosPerformados.forEach(exPerf => {
            if (exPerf.exercicioBaseId === exercicioSelecionadoId && typeof exPerf.cargaUtilizadaKg === 'number') {
              cargaDataPoints.push({ x: new Date(sessao.dataRealizacao.seconds * 1000), y: exPerf.cargaUtilizadaKg });
            }
          });
        }
      });
      cargaDataPoints.sort((a, b) => a.x.getTime() - b.x.getTime());
      setChartDataCarga({
        series: [{ name: 'Carga (kg)', data: cargaDataPoints }],
        options: {
            theme: { mode: 'dark', palette: 'palette1' }, 
            chart: { id: 'grafico-evolucao-carga-final', type: 'line', height: 350, zoom: { enabled: true }, background: 'transparent' },
            xaxis: { type: 'datetime', title: { text: 'Data do Treino' }, labels: { datetimeUTC: false, format: 'dd MMM yy' } },
            yaxis: { title: { text: 'Carga (kg)' }, min: 0 },
            title: { text: 'Evolução da Carga por Exercício', align: 'center' },
            stroke: { curve: 'smooth' }, markers: {size: 5},
            tooltip: { theme: 'dark', x: { format: 'dd MMM yy' } }
        }
      });
      setLoadingCarga(false);
    }, (error) => { setLoadingCarga(false); });
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
            if (dataDaSessao.getMonth() === mesAtual && dataDaSessao.getFullYear() === anoAtual) {
                sessoesNoMesAtual++;
            }
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
    }, (error) => {
        console.error("Erro ao buscar recordes:", error);
        setLoadingRecordes(false);
    });
    return () => unsubscribe();
  }, [usuario]);

  return (
    <div className="py-4">
      <Row className="text-center mb-4">
        <Col>
          <h1>Dashboard</h1>
          <p className="lead text-muted">Seu painel de controle de treinos.</p>
        </Col>
      </Row>
      
      <Row className="mb-4 text-center">
        <Col>
          <Link to="/registrar-progresso"> 
            <Button variant="success" size="lg" className="shadow">
              + Registrar Progresso Semanal
            </Button>
          </Link>
        </Col>
      </Row>

      {/* --- SEÇÃO DE KPIs CORRIGIDA --- */}
      <Row className="mb-4 g-4">
        <Col md={6} className="d-flex align-items-stretch">
          <Card className="w-100 text-center" data-bs-theme="dark">
            <Card.Body className="d-flex flex-column justify-content-center">
              <Card.Title as="h3" className="h5">Sessões no Mês</Card.Title>
              <p className="display-4 fw-bold text-success">{totalSessoesMes}</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} className="d-flex align-items-stretch">
          <Card className="w-100 text-center" data-bs-theme="dark">
            <Card.Body className="d-flex flex-column justify-content-center">
              <Card.Title as="h3" className="h5">Maior Carga (1 PR)</Card.Title>
              {loadingRecordes ? <Spinner animation="border" size="sm"/> : (
                <>
                  <p className="display-4 fw-bold text-success">
                    {recordesPessoais[0] ? `${recordesPessoais[0].maiorCargaKg} kg` : '-'}
                  </p>
                  <Card.Subtitle className="text-muted">
                    {recordesPessoais[0] ? `(${recordesPessoais[0].nomeExercicioSnapshot})` : 'Nenhum registro'}
                  </Card.Subtitle>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {/* --- FIM DA SEÇÃO DE KPIs CORRIGIDA --- */}

      {/* Quadro de Recordes Pessoais Detalhado */}
      <Card data-bs-theme="dark" className="mb-4">
        <Card.Header as="h3" className="text-center">🏆 Quadro de Recordes Pessoais</Card.Header>
        {loadingRecordes ? (
          <Card.Body className="text-center"><Spinner animation="border" /></Card.Body>
        ) : (
          recordesPessoais.length === 0 ? (
            <Card.Body><p className="text-muted text-center">Nenhum recorde registrado ainda.</p></Card.Body>
          ) : (
            <ListGroup variant="flush">
              {recordesPessoais.map(pr => (
                <ListGroup.Item key={pr.id} className="d-flex justify-content-between align-items-start">
                  <div className="ms-2 me-auto">
                    <div className="fw-bold fs-5">{pr.nomeExercicioSnapshot}</div>
                    <div className="ms-3">
                      <div>
                        <strong>Maior Carga:</strong> 
                        <span className="badge bg-success rounded-pill ms-2 fs-6">{pr.maiorCargaKg} kg</span>
                        <small className="text-muted ms-2"> (em {pr.dataMaiorCarga ? new Date(pr.dataMaiorCarga.toDate()).toLocaleDateString('pt-BR') : ''})</small>
                      </div>
                      {pr.recordesPorCarga && pr.recordesPorCarga.length > 0 && (
                        <div className="mt-2">
                          <strong>Melhores Repetições:</strong>
                          <ul className="list-unstyled ms-3">
                            {pr.recordesPorCarga.sort((a,b) => b.cargaKg - a.cargaKg).slice(0, 3).map((repPr, index) => (
                              <li key={index}>
                                <span className="badge bg-info text-dark rounded-pill">{repPr.cargaKg} kg x {repPr.reps} reps</span>
                              </li>
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
        <Card.Header as="h3" className="text-center">Analisar Evolução da Carga</Card.Header>
        <Card.Body>
          <div className="mb-3 text-center">
            <label htmlFor="selectExercicioCarga" className="form-label me-2">Selecione um exercício: </label>
            <select
              id="selectExercicioCarga"
              className="form-select w-auto d-inline-block"
              value={exercicioSelecionadoId} 
              onChange={(e) => setExercicioSelecionadoId(e.target.value)} 
              disabled={exercicios.length === 0 || loadingCarga}
            >
              {loadingCarga && exercicios.length === 0 && <option value="">Carregando...</option>}
              {!loadingCarga && exercicios.length === 0 && <option value="">Nenhum exercício</option>}
              {exercicios.map(ex => (
                <option key={ex.id} value={ex.id}>{ex.nome}</option>
              ))}
            </select>
          </div>
          <div>
            {loadingCarga ? (<p className="text-center text-muted">Carregando...</p>) : 
             (chartDataCarga.series && chartDataCarga.series.length > 0 && chartDataCarga.series[0].data.length > 0 ?
                <Chart options={chartDataCarga.options} series={chartDataCarga.series} type="line" height={350}/>
                : <p className="text-center text-muted">Sem dados para este exercício.</p>
             )
            }
          </div>
        </Card.Body>
      </Card>
      
      <Card data-bs-theme="dark">
        <Card.Header as="h3" className="text-center">Volume Total Semanal</Card.Header>
        <Card.Body>
          {loadingVolume ? (
            <p className="text-center text-muted">Carregando...</p>
          ) : (
            chartDataVolumeSemanal.series && chartDataVolumeSemanal.series.length > 0 && chartDataVolumeSemanal.series[0].data.length > 0 ?
            <Chart
              options={chartDataVolumeSemanal.options}
              series={chartDataVolumeSemanal.series}
              type="bar"
              height={350}
            />
            : <p className="text-center text-muted">Sem dados de volume para exibir.</p>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default PaginaPrincipal;