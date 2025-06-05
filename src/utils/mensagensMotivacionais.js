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
  
    const carga = Number(cargaKg); // Garante que é um número
  
    if (isNaN(carga) || carga <= 0) {
      return "Bom treino! Continue registrando para ver sua evolução! 💪"; // Mensagem neutra
    } else if (carga >= 1 && carga <= 10) {
      equivalente = "um cachorro gordo"; emoji = "🐶";
    } else if (carga >= 11 && carga <= 25) {
      equivalente = "um botijão de gás"; emoji = "🔥";
    } else if (carga >= 26 && carga <= 50) {
      equivalente = "uma geladeira pequena"; emoji = "❄️";
    } else if (carga >= 51 && carga <= 80) {
      equivalente = "um sofá de 3 lugares"; emoji = "🛋️";
    } else if (carga >= 81 && carga <= 120) {
      equivalente = "um piano de parede"; emoji = "🎹";
    } else if (carga >= 121 && carga <= 180) {
      equivalente = "um camelo"; emoji = "🐫";
    } else if (carga >= 181 && carga <= 250) {
      equivalente = "meio carro popular"; emoji = "🚗";
    } else if (carga >= 251 && carga <= 400) {
      equivalente = "um hipopótamo filhote"; emoji = "🦛";
    } else { // Mais de 400kg
      equivalente = "um rinoceronte inteiro"; emoji = "🦏";
      fraseIncentivo = "Você tá insano(a)! 🤯";
    }
  
    return `Na sua série mais pesada hoje você levantou ${carga} kg. Isso é como levantar ${equivalente}! ${emoji} ${fraseIncentivo}`;
  };