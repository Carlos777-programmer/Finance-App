# Finance Matrix - Assistente Financeiro Inteligente 💎💳

![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)
![React Native](https://img.shields.io/badge/react_native-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Expo](https://img.shields.io/badge/expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=googlecloud&logoColor=white)

Aplicação mobile e backend de gestão financeira pessoal com interface moderna em **Glassmorphism**, suporte a entrada de dados via **Processamento de Linguagem Natural (PLN)**, leitor automático de **faturas CSV** e um módulo dedicado de **IA Mentor Financeiro** movido pela SDK do **Google Gemini (geração Gemini 3)**.

---

## 🚀 1. Funcionalidades Principais

* **Lançamentos via Linguagem Natural (IA Prompt):** Cadastre receitas ou despesas digitando frases cotidianas (ex: *"Gastei 45 no mercado hoje no Nubank"*) e a inteligência artificial extrai automaticamente valor, descrição, categoria e instituição.
* **Mentor Financeiro Pessoal (AI Coach):** Módulo de diagnóstico patrimonial que analisa o saldo real de todas as contas, distribuição de gastos e calcula métricas cruciais como cobertura de reserva de emergência e metas numéricas quantificáveis em R$.
* **Gestão de Contas e Bancos:** Centralização de múltiplas contas bancárias e carteiras com atualização de saldo em tempo real derivada do fluxo de caixa.
* **Categorização Dinâmica de Transações:** Atribuição e alteração rápida de categorias direto da tela inicial através de modal interativo contendo ícones e categorias do dia a dia (boletos, vestuário, assinaturas, mercado, etc.).
* **Importador de Faturas e Extratos (CSV Parser):** Leitura flexível de arquivos CSV exportados dos principais bancos (Nubank, Itaú, Inter, Bradesco, Santander), identificando saídas/entradas e tratando valores em formato BRL automaticamente.
* **Orçamento & Analytics:** Definição de meta mensal de gastos, acompanhamento em barra neon progressiva e distribuição percentual de despesas por categoria.
* **Interface Futurística em Glassmorphism:** Design mobile em modo escuro (*Dark Mode*), feedbacks táticos (*Haptics*), animações fluidas com React Native Animated e ocultação rápida de saldos para privacidade.

---

## 🛠️ 2. Tecnologias Utilizadas

### Backend (API REST)
* **Linguagem:** Python 3.10+
* **Framework Web:** FastAPI + Uvicorn
* **ORM & Banco de Dados:** SQLAlchemy + SQLite3
* **Inteligência Artificial:** Google GenAI SDK (`google-genai`) utilizando os modelos da série **Gemini 3** (`gemini-3.8-flash`, `gemini-3.5-flash`, `gemini-3-flash`) com esquema estruturado Pydantic.
* **Processamento de Dados:** Pandas (Processamento e leitura de tabelas CSV).

### Frontend (Mobile App)
* **Framework Mobile:** React Native (Expo)
* **Estilização & Efeitos:** `expo-blur` (Glassmorphic BlurView), `expo-linear-gradient`
* **Navegação & Animações:** `@react-navigation/native`, React Native Animated API
* **UX & Acessibilidade:** `expo-haptic-feedback`, `@expo/vector-icons` (Feather, MaterialCommunityIcons), `expo-document-picker` e `expo-file-system`

---

## ⚙️ 3. Instalação e Configuração

### 3.1 Pré-requisitos
* Python 3.10 ou superior instalado.
* Node.js e gerenciador de pacotes `npm` ou `yarn`.
* Aplicativo **Expo Go** instalado no dispositivo móvel ou um emulador configurado (Android Studio / Xcode).

---

### 3.2 Configurando o Backend (FastAPI)

1. **Acesse a pasta do backend:**
```bash
cd backend
```

2. **Crie e ative o ambiente virtual:**
```bash
# Linux / macOS:
python3 -m venv venv
source venv/bin/activate

# Windows (PowerShell):
python -m venv venv
.\venv\Scripts\Activate.ps1

```


3. **Instale as dependências:**
```bash
pip install -r requirements.txt

```


4. **Configure as Variáveis de Ambiente:**
Crie um arquivo `.env` na raiz da pasta do backend contendo a sua chave da API do Google Gemini:
```env
GEMINI_API_KEY=sua_chave_gemini_api_aqui
CORS_ORIGINS=*

```


5. **Execute o Servidor FastAPI:**
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

```


> *O servidor iniciará em `http://localhost:8000` e criará o banco local `financas.db` automaticamente.*



---

### 3.3 Configurando o Frontend (React Native / Expo)

1. **Acesse a pasta do aplicativo:**
```bash
cd frontend

```


2. **Instale os pacotes e dependências:**
```bash
npm install

```


3. **Ajuste o IP da API:**
Nos arquivos do aplicativo (`HomeScreen.js`, `ContasScreen.js`, `AnalyticsScreen.js`, `FaturasScreen.js`, `MentorScreen.js`), certifique-se de que a variável `API_URL` reflete o IP local da sua máquina na rede:
```javascript
const API_URL = '[http://192.168.](http://192.168.)X.X:8000';

```


4. **Inicie o projeto Expo:**
```bash
npx expo start

```


*Escaneie o QR Code no app **Expo Go** em seu celular para rodar a aplicação.*

---

## 📌 4. Rotas da API (Endpoints Principais)

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `GET` | `/api/v1/transacoes` | Lista todas as movimentações financeiras |
| `POST` | `/api/v1/processar-prompt` | Processa texto livre via Gemini e registra transação |
| `PUT` | `/api/v1/transacoes/{id}/categoria` | Altera ou atribui uma categoria a uma transação |
| `DELETE` | `/api/v1/transacoes/{id}` | Apaga uma transação |
| `GET` | `/api/v1/contas` | Lista todas as contas/bancos e seus saldos |
| `POST` | `/api/v1/contas` | Cadastra ou atualiza uma conta bancária |
| `PUT` | `/api/v1/contas/{id}` | Edita o saldo inicial ou nome da conta |
| `DELETE` | `/api/v1/contas/{id}` | Deleta uma conta bancária |
| `POST` | `/api/v1/importar-csv-texto` | Importa e categoriza extratos CSV enviados em lote |
| `GET` | `/api/v1/mentor-financeiro` | Gera o diagnóstico completo e score de saúde financeira com Gemini |

---

## 📈 Roadmap de Desenvolvimento

* [x] Arquitetura base FastAPI + React Native com Expo.
* [x] Lançamentos de despesas/receitas via PLN com Gemini 3 SDK.
* [x] Módulo de gestão de patrimônio bancário multi-contas.
* [x] Importador e leitor flexível de arquivos CSV.
* [x] Categorização dinâmica com suporte a categorias cotidianas.
* [x] Mentor Financeiro inteligente com metas numéricas em R$ e análise de reserva.
* [ ] Gráficos interativos com projeção de patrimônio futuro.
* [ ] Exportação de relatórios em PDF.

---

## 👤 Desenvolvido por

**Carlos Marques**

[LinkedIn](https://www.linkedin.com/in/carlos-marques-0b9346267/) | [GitHub](https://github.com/Carlos777-programmer)
