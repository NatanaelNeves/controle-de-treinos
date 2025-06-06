// src/components/TimerDescanso.js
import React, { useState, useEffect, useRef } from 'react';
import { Button, ProgressBar, Row, Col } from 'react-bootstrap';
import { FaPlay, FaPause, FaRedo, FaCheckCircle } from 'react-icons/fa';

const TimerDescanso = () => {
  const [tempoTotal, setTempoTotal] = useState(0);
  const [tempoRestante, setTempoRestante] = useState(0);
  const [timerAtivo, setTimerAtivo] = useState(false);
  const [descansoConcluido, setDescansoConcluido] = useState(false);
  
  const audioRef = useRef(null);

  useEffect(() => {
    try {
        // Verifique se o nome do seu arquivo de áudio na pasta /public está correto
        audioRef.current = new Audio('/notification.mp3'); 
    } catch(e) {
        console.warn("Não foi possível carregar o arquivo de áudio. O som de notificação não funcionará.", e);
    }
  }, []);
  
  useEffect(() => {
    if (!timerAtivo || tempoRestante <= 0) {
      if (timerAtivo && tempoRestante <= 0) {
        setDescansoConcluido(true);
        if (audioRef.current) {
            try {
              audioRef.current.play();
            } catch(e) {
              console.error("Erro ao tocar o som de notificação:", e);
            }
        }
      }
      setTimerAtivo(false);
      return;
    }

    const intervalId = setInterval(() => {
      setTempoRestante(prev => prev - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timerAtivo, tempoRestante]);

  const iniciarTimer = (segundos) => {
    setTempoTotal(segundos);
    setTempoRestante(segundos);
    setDescansoConcluido(false);
    setTimerAtivo(true);
  };

  const pausarRetomarTimer = () => {
    setTimerAtivo(!timerAtivo);
  };

  // FUNÇÃO ATUALIZADA
  const resetarTimer = () => {
    setTimerAtivo(false);
    setDescansoConcluido(false);
    setTempoRestante(0);
    setTempoTotal(0);

    // ADIÇÃO: Para o som e o "rebobina" para o início
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const formatarTempo = (segundos) => {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
  };

  const progresso = tempoTotal > 0 ? (tempoRestante / tempoTotal) * 100 : 0;

  // Renderização condicional (sem mudanças na lógica, apenas no texto de um botão)
  const renderizarConteudo = () => {
    if (descansoConcluido) {
      return (
        <Button variant="success" onClick={resetarTimer} size="lg" className="w-100">
          <FaCheckCircle className="me-2" /> Descanso Concluído (Resetar)
        </Button>
      );
    }
    
    if (tempoTotal === 0) { // Estado Inicial
      return (
        <div className="d-flex justify-content-center">
          <Button variant="outline-light" onClick={() => iniciarTimer(60)} className="me-2">⏱️ 60s</Button>
          <Button variant="outline-light" onClick={() => iniciarTimer(90)} className="me-2">⏱️ 90s</Button>
          <Button variant="outline-light" onClick={() => iniciarTimer(120)}>⏱️ 120s</Button>
        </div>
      );
    }

    // Estado ativo ou pausado
    return (
      <Row className="w-100 align-items-center">
        <Col xs={4} className="text-center">
          <span className="fw-bold fs-3">{formatarTempo(tempoRestante)}</span>
        </Col>
        <Col xs={4}>
          <ProgressBar now={progresso} variant="success" animated={timerAtivo} />
        </Col>
        <Col xs={4} className="text-center">
          <Button variant="light" onClick={pausarRetomarTimer} className="me-2">
            {timerAtivo ? <FaPause title="Pausar" /> : <FaPlay title="Retomar" />}
          </Button>
          <Button variant="outline-danger" onClick={resetarTimer}>
            <FaRedo title="Cancelar/Resetar" />
          </Button>
        </Col>
      </Row>
    );
  };

  return (
    <div style={{ 
      position: 'fixed', bottom: 0, left: 0, width: '100%', 
      backgroundColor: '#212529', color: 'white', padding: '15px', 
      boxShadow: '0 -2px 10px rgba(0,0,0,0.5)', zIndex: 1050,
      borderTop: '1px solid #495057', 
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'
    }}>
      <h6 className="text-muted mb-0 text-uppercase" style={{letterSpacing: '1px', userSelect: 'none'}}>
        Timer de Descanso
      </h6>
      {renderizarConteudo()}
    </div>
  );
};

export default TimerDescanso;