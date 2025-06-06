// src/PaginaMeusRecordes.js
import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';

// Imports do React-Bootstrap e Ícones
import Accordion from 'react-bootstrap/Accordion';
import ListGroup from 'react-bootstrap/ListGroup';
import Spinner from 'react-bootstrap/Spinner';
import { FaTrophy, FaWeightHanging, FaRedo } from 'react-icons/fa';

const PaginaMeusRecordes = ({ usuario }) => {
  const [recordes, setRecordes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!usuario) {
      setLoading(false);
      setRecordes([]);
      return;
    }

    setLoading(true);
    const recordesRef = collection(db, 'usuarios', usuario.uid, 'recordesPessoais');
    // Ordena pelo nome do exercício para uma lista organizada
    const qRecordes = query(recordesRef, orderBy('nomeExercicioSnapshot', 'asc'));

    const unsubscribe = onSnapshot(qRecordes, (snapshot) => {
        const listaRecordes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecordes(listaRecordes);
        setLoading(false);
    }, (error) => {
        console.error("Erro ao buscar recordes pessoais:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [usuario]);

  if (loading) {
    return <div className="text-center mt-5"><Spinner animation="border" /></div>;
  }

  return (
    <div>
      <h2 className="mb-4">🏆 Hall da Fama - Meus Recordes Pessoais</h2>
      
      {recordes.length === 0 ? (
        <p className="text-muted">Nenhum recorde pessoal registrado ainda. Continue treinando e registrando para ver suas conquistas aqui!</p>
      ) : (
        <Accordion defaultActiveKey="0" alwaysOpen>
          {recordes.map((pr, index) => (
            <Accordion.Item eventKey={String(index)} key={pr.id}>
              <Accordion.Header>
                <span className="fw-bold fs-5">{pr.nomeExercicioSnapshot}</span>
              </Accordion.Header>
              <Accordion.Body>
                <div className="mb-3">
                  <h5><FaWeightHanging className="me-2" />Maior Carga</h5>
                  <p className="fs-4 ms-4">
                    <strong>{pr.maiorCargaKg} kg</strong>
                    <small className="text-muted ms-2">
                      (em {pr.dataMaiorCarga ? new Date(pr.dataMaiorCarga.toDate()).toLocaleDateString('pt-BR') : 'data antiga'})
                    </small>
                  </p>
                </div>

                {pr.recordesPorCarga && pr.recordesPorCarga.length > 0 && (
                  <div>
                    <h5><FaRedo className="me-2" />Melhores Repetições por Carga</h5>
                    <ListGroup variant="flush">
                      {pr.recordesPorCarga
                        .sort((a, b) => b.cargaKg - a.cargaKg) // Ordena pela carga mais pesada
                        .map((repPr, repIndex) => (
                          <ListGroup.Item key={repIndex} className="d-flex justify-content-between align-items-center">
                            <span>{repPr.cargaKg} kg</span>
                            <span className="fw-bold">{repPr.reps} reps</span>
                            <small className="text-muted">
                              (em {repPr.data ? new Date(repPr.data.toDate()).toLocaleDateString('pt-BR') : ''})
                            </small>
                          </ListGroup.Item>
                        ))}
                    </ListGroup>
                  </div>
                )}
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      )}
    </div>
  );
};

export default PaginaMeusRecordes;