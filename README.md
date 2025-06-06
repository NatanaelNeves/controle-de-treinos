FitTrack Pro 🏋️‍♂️
FitTrack Pro é um sistema web moderno, responsivo e inteligente para registro e acompanhamento da evolução em treinos de musculação. Inspirado na necessidade de acompanhar o progresso de forma clara e motivadora, este aplicativo substitui planilhas manuais por uma plataforma interativa, visual e acessível em qualquer dispositivo.

(Sugestão: Substitua este link de imagem pelo link do ícone que você escolheu, ou adicione um GIF do aplicativo em ação!)

🚀 Sobre o Projeto
O projeto nasceu da ideia de transformar a planilha de treino do meu amigo Cauã em uma ferramenta digital poderosa. O objetivo era criar um sistema onde ele pudesse não apenas registrar suas cargas e repetições, mas também visualizar sua evolução de forma clara, planejar seus ciclos de treino e receber feedback inteligente e motivador para continuar progredindo.

O resultado é uma Single-Page Application (SPA) completa, construída com React, que se conecta a um backend serverless no Firebase, garantindo segurança, escalabilidade e uma experiência em tempo real.

✨ Funcionalidades Principais
[x] Autenticação Segura: Sistema completo de Cadastro e Login de usuários.
[x] Rotas Protegidas: Páginas acessíveis apenas para usuários autenticados.
[x] Planejamento de Treino Completo:
Criação e gerenciamento de Planos de Treino de longo prazo (ciclos).
Definição de Grupos de Treino (A, B, C...) para cada plano.
Prescrição detalhada de Exercícios para cada grupo, com metas de séries e repetições.
[x] Registro de Progresso Detalhado:
Interface para registrar cada série individualmente (carga e repetições).
Cálculo automático da semana do ciclo com base na data de início do plano.
Campo para observações por exercício e por sessão de treino.
[x] Feedback Inteligente e Motivacional:
Detector de Recordes Pessoais (PRs) para carga máxima e repetições por carga.
Mensagens motivacionais e engraçadas baseadas na performance (volume total e PRs).
Notificações via Toasts para uma experiência de usuário fluida.
[x] Dashboard de Evolução:
KPIs: Indicadores rápidos como "Sessões no Mês".
Hall da Fama: Quadro de Recordes Pessoais com os melhores desempenhos.
Visualização Criativa de Evolução: Cards interativos que mostram a progressão de carga e a diferença em relação ao treino anterior.
Resumo Semanal de Volume: Cards com barra de progresso e feedback divertido sobre o volume total levantado na semana.
[x] Histórico de Treinos Completo:
Lista de todas as sessões de treino registradas.
Filtros por Mês/Ano e por Exercício Específico. <!-- end list -->
Modal de Detalhes para ver cada série de cada exercício de uma sessão passada.
[x] Utilitários de Treino:
Timer de Descanso integrado à tela de registro de progresso, com presets, controle e alerta sonoro.
[x] Interface Moderna e Responsiva:
Design com tema escuro (dark mode).
Construído com React-Bootstrap para componentes profissionais e responsivos.
Uso de ícones para uma navegação intuitiva.
🛠️ Tecnologias Utilizadas
Este projeto foi construído utilizando um stack de tecnologias modernas e populares no ecossistema JavaScript:

Frontend:

React.js
React Router para o roteamento.
React-Bootstrap para os componentes de UI.
React-Icons para a iconografia.
Framer Motion para animações.
ApexCharts (usado nas versões iniciais do Dashboard).
Backend & Database (BaaS):

Firebase
Firestore: Como banco de dados NoSQL em tempo real.
Authentication: Para gerenciamento de usuários.
Hosting: Para o deploy final (sugestão).
Deploy:

Vercel (plataforma recomendada para o deploy).
⚙️ Como Rodar o Projeto Localmente
Para rodar este projeto no seu ambiente de desenvolvimento, siga os passos abaixo:

Pré-requisitos:

Node.js (versão 18 ou superior).
npm ou yarn como gerenciador de pacotes.
Clone o Repositório:

Bash

git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
cd controle-de-treinos
Instale as Dependências:

Bash

npm install
ou, se estiver usando yarn:

Bash

yarn install
Configure o Firebase:

Vá para o console do Firebase e crie um novo projeto.
Na página do seu projeto, crie um aplicativo da Web e copie as credenciais do firebaseConfig.
Ative os serviços Authentication (com provedor de E-mail/Senha) e Firestore Database (no modo de produção e defina as regras de segurança).
Crie o Arquivo de Variáveis de Ambiente:

Na raiz do seu projeto, crie um arquivo chamado .env.local.
Copie e cole o conteúdo abaixo nele, substituindo pelos valores das suas credenciais do Firebase:
Snippet de código

REACT_APP_FIREBASE_API_KEY=SUA_API_KEY
REACT_APP_FIREBASE_AUTH_DOMAIN=SEU_AUTH_DOMAIN
REACT_APP_FIREBASE_PROJECT_ID=SEU_PROJECT_ID
REACT_APP_FIREBASE_STORAGE_BUCKET=SEU_STORAGE_BUCKET
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=SEU_MESSAGING_SENDER_ID
REACT_APP_FIREBASE_APP_ID=SEU_APP_ID
O arquivo src/firebase.js já está configurado para ler essas variáveis.
Rode a Aplicação:

Bash

npm start
O aplicativo deverá abrir em http://localhost:3000.