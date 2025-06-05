// src/PaginaRegistroTreino.js
import React, { useState, useEffect } from 'react';
import { db } from './firebase'; // Removido 'auth' pois 'usuario' vem como prop
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

const gerarMensagemEngracada = (cargaKg) => {
  // ... (função gerarMensagemEngracada continua a mesma)
  let equivalente = "";
  let emoji = "";
  let fraseIncentivo = "";
  const frases = [
    "Tá forte, hein?!", "Continue assim e logo levanta um prédio!", "Isso é força ou é magia?",
    "Monstro(a)!", "Impressionante!", "Você é uma máquina!", "Brabo/Braba demais!"
  ];
  fraseIncentivo = frases[Math.floor(Math.random() * frases.length)];

  if (cargaKg <= 0) {
    return "Hmm, carga zero? Tem certeza que não esqueceu de adicionar peso? 🤔";
  } else if (cargaKg >= 1 && cargaKg <= 10) {
    equivalente = "um cachorro gordo"; emoji = "🐶";
  } else if (cargaKg >= 11 && cargaKg <= 25) {
    equivalente = "um botijão de gás"; emoji = "🔥";
  } else if (cargaKg >= 26 && cargaKg <= 50) {
    equivalente = "uma geladeira pequena"; emoji = "❄️";
  } else if (cargaKg >= 51 && cargaKg <= 80) {
    equivalente = "um sofá de 3 lugares"; emoji = "🛋️";
  } else if (cargaKg >= 81 && cargaKg <= 120) {
    equivalente = "um piano de parede"; emoji = "🎹";
  } else if (cargaKg >= 121 && cargaKg <= 180) {
    equivalente = "um camelo"; emoji = "🐫";
  } else if (cargaKg >= 181 && cargaKg <= 250) {
    equivalente = "meio carro popular"; emoji = "🚗";
  } else if (cargaKg >= 251 && cargaKg <= 400) {
    equivalente = "um hipopótamo filhote"; emoji = "🦛";
  } else {
    equivalente = "um rinoceronte inteiro"; emoji = "🦏";
    fraseIncentivo = "Você tá insano(a)! 🤯";
  }
  return `Você levantou ${cargaKg} kg. Isso é como levantar ${equivalente}! ${emoji} ${fraseIncentivo}`;
};

const PaginaRegistroTreino = ({ usuario }) => {
  const [exercicios, setExercicios] = useState([]);
  const [loadingExercicios, setLoadingExercicios] = useState(true); // Estado de carregamento para exercícios
  const [exercicioSelecionadoId, setExercicioSelecionadoId] = useState('');
  const [carga, setCarga] = useState('');
  const [repeticoes, setRepeticoes] = useState('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (!usuario) {
        setLoadingExercicios(false);
        return;
    }
    setLoadingExercicios(true);
    const fetchExercicios = async () => {
      try {
        // CORREÇÃO AQUI: Usar a coleção 'exercicios' e o campo 'userId'
        // E o campo do nome do exercício é 'nome' (não 'nomeExercicio')
        const q = query(collection(db, "exercicios"), where("userId", "==", usuario.uid));
        const querySnapshot = await getDocs(q);
        const listaExercicios = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setExercicios(listaExercicios);
        if (listaExercicios.length > 0) {
          setExercicioSelecionadoId(listaExercicios[0].id);
        } else {
          setExercicioSelecionadoId(''); // Limpa se não houver exercícios
        }
      } catch (error) {
          console.error("Erro ao buscar exercícios: ", error);
      } finally {
        setLoadingExercicios(false);
      }
    };
    fetchExercicios();
  }, [usuario]);

  const handleRegistrarSerie = async (e) => {
    e.preventDefault();
    if (!exercicioSelecionadoId && exercicios.length > 0) { // Verifica se há exercícios mas nenhum foi selecionado
      alert("Por favor, selecione um exercício.");
      return;
    }
    if (exercicios.length === 0 && !exercicioSelecionadoId) {
        alert("Você precisa cadastrar exercícios primeiro na página 'Meus Exercícios'.");
        return;
    }
    if (!carga || !repeticoes) {
      alert("Por favor, preencha carga e repetições.");
      return;
    }
    // ... (resto da função handleRegistrarSerie continua igual, com parseFloat etc.)
    const cargaNum = parseFloat(carga);
    const repeticoesNum = parseInt(repeticoes);

    if (isNaN(cargaNum) || isNaN(repeticoesNum)) {
        alert("Carga e repetições devem ser números válidos.");
        return;
    }

    try {
      const volume = cargaNum * repeticoesNum;
      // ATENÇÃO: Mantenha 'treinos' se você não alterou a estrutura para sessoesRegistradas.
      // Se você está usando a estrutura 'sessoesRegistradas' com 'exerciciosPerformados',
      // a lógica de salvar será diferente e mais complexa aqui.
      // Este código assume que você ainda está salvando séries individuais na coleção 'treinos'.
      await addDoc(collection(db, 'treinos'), { 
        userId: usuario.uid,
        exercicioId: exercicioSelecionadoId, // Na nova estrutura, seria exercicioBaseId e talvez nomeExercicioSnapshot
        data: serverTimestamp(),
        carga: cargaNum,
        repeticoes: repeticoesNum,
        volume: volume,
        observacoes: observacoes,
      });

      const mensagemMotivacional = gerarMensagemEngracada(cargaNum);
      alert(mensagemMotivacional);
      
      setCarga('');
      setRepeticoes('');
      setObservacoes('');
    } catch (error) {
      console.error("Erro ao registrar série: ", error);
      alert("Ocorreu um erro ao registrar a série.");
    }
  };

  return (
    <div>
      <h2>Registrar Série de Treino</h2>
      <form onSubmit={handleRegistrarSerie}>
        <div>
          <label>Exercício: </label>
          <select 
            value={exercicioSelecionadoId} 
            onChange={(e) => setExercicioSelecionadoId(e.target.value)} 
            disabled={loadingExercicios || exercicios.length === 0}
          >
            {loadingExercicios && <option value="">Carregando exercícios...</option>}
            {!loadingExercicios && exercicios.length === 0 && <option value="">Nenhum exercício cadastrado</option>}
            {/* Adiciona uma opção default se houver exercícios mas nenhum selecionado */}
            {!loadingExercicios && exercicios.length > 0 && !exercicioSelecionadoId && <option value="">Selecione um exercício</option>}
            {exercicios.map(ex => (
              // CORREÇÃO AQUI: Usar ex.nome para o nome do exercício
              <option key={ex.id} value={ex.id}>
                {ex.nome} 
              </option>
            ))}
          </select>
        </div>
        {/* ... (resto do formulário: carga, repetições, observações, botão) ... */}
        <div style={{ marginTop: '10px' }}>
          <label>Carga (kg): </label>
          <input type="number" value={carga} onChange={(e) => setCarga(e.target.value)} placeholder="Ex: 80" step="0.1" required />
        </div>
        <div style={{ marginTop: '10px' }}>
          <label>Repetições: </label>
          <input type="number" value={repeticoes} onChange={(e) => setRepeticoes(e.target.value)} placeholder="Ex: 10" required />
        </div>
        <div style={{ marginTop: '10px' }}>
          <label>Observações (opcional): </label>
          <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Ex: Boa forma..." rows="3" style={{ width: '100%', boxSizing: 'border-box' }} />
        </div>
        <button type="submit" style={{ marginTop: '20px' }}>Registrar Série</button>
      </form>
    </div>
  );
};

export default PaginaRegistroTreino;