// src/utils/mensagensMotivacionais.js

export const gerarMensagemEngracada = (cargaKg) => {
  let equivalente = "";
  let emoji = "";
  let fraseIncentivo = "";
  const frasesIncentivoPool = [
    "Tá forte, hein?!", "Continue assim e logo levanta um prédio!", "Isso é força ou é magia?",
    "Monstro(a)!", "Impressionante!", "Você é uma máquina!", "Brabo/Braba demais!"
  ];
  fraseIncentivo = frasesIncentivoPool[Math.floor(Math.random() * frasesIncentivoPool.length)];
  const carga = Number(cargaKg);
  if (isNaN(carga) || carga <= 0) return "Bom treino! Continue registrando para ver sua evolução! 💪";
  
  if (carga >= 1 && carga <= 10) { equivalente = "um cachorro gordo"; emoji = "🐶"; } 
  else if (carga <= 25) { equivalente = "um botijão de gás"; emoji = "🔥"; } 
  else if (carga <= 50) { equivalente = "uma geladeira pequena"; emoji = "❄️"; } 
  else if (carga <= 80) { equivalente = "um sofá de 3 lugares"; emoji = "🛋️"; } 
  else if (carga <= 120) { equivalente = "um piano de parede"; emoji = "🎹"; } 
  else if (carga <= 180) { equivalente = "um camelo"; emoji = "🐫"; } 
  else if (carga <= 250) { equivalente = "meio carro popular"; emoji = "🚗"; } 
  else if (carga <= 400) { equivalente = "um hipopótamo filhote"; emoji = "🦛"; } 
  else { equivalente = "um rinoceronte inteiro"; emoji = "🦏"; fraseIncentivo = "Você tá insano(a)! 🤯"; }
  
  return `Na sua série mais pesada hoje você levantou ${carga} kg. Isso é como levantar ${equivalente}! ${emoji} ${fraseIncentivo}`;
};

// NOVA FUNÇÃO PARA O VOLUME TOTAL SEMANAL
export const gerarMensagemVolume = (volume) => {
    const volumeKg = Math.round(volume);
    if (volumeKg < 5000) return `Você movimentou ${volumeKg}kg essa semana — 🐒 Isso é um bando de bananas!`;
    if (volumeKg < 10000) return `Você movimentou ${volumeKg}kg essa semana — 🛵 É o peso de uma moto scooter!`;
    if (volumeKg < 20000) return `Você movimentou ${volumeKg}kg essa semana — 🐫 Equivalente a 3 camelos!`;
    if (volumeKg < 30000) return `Você movimentou ${volumeKg}kg essa semana — 🚛 Isso dá pra encher um caminhão!`;
    if (volumeKg < 50000) return `Você movimentou ${volumeKg}kg essa semana — 🏗️ Você é basicamente um guindaste humano!`;
    return `Você movimentou ${volumeKg}kg essa semana — 🔥 Isso é o peso de um hipopótamo adulto! Tá insano! 🦛`;
}