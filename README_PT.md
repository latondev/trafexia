# Trafexia - Ferramenta de Interceptação e Análise de Tráfego de Rede Móvel

Uma aplicação desktop poderosa para interceptar, analisar e manipular tráfego HTTP/HTTPS de dispositivos móveis. Construída com Electron, Vue 3 e TypeScript.

O Trafexia fornece ferramentas abrangentes para testes de segurança de aplicações móveis, engenharia reversa e depuração de APIs com recursos avançados como bypass de SSL pinning, respostas simuladas (mocking), redirecionamento de tráfego (map rules) e muito mais.

---

## ✨ Recursos Principais

### 🔐 Evasão de SSL/TLS (SSL Bypass)
- **Scripts de bypass integrados** - Suporta OkHttp3, Conscrypt, WebView, Flutter, React Native e muito mais.
- **Modificação de APK (APK Patching)** - Injete scripts de bypass diretamente em APKs sem a necessidade de dispositivos rooteados.
- **Integração com Frida Gadget** - Injeção de código dinâmica usando o Frida para hookeado em tempo de execução.

### 📊 Análise de Tráfego em Tempo Real
- **Captura em tempo real** - Intercepte e exiba solicitações HTTP/HTTPS em tempo real.
- **Visualização por Linha do Tempo (Timeline)** - Acompanhe graficamente a distribuição e frequência das solicitações ao longo do tempo.
- **Filtros avançados** - Filtre por método HTTP, código de status, host, caminho URL, etc.
- **Comparação de solicitações (Diff)** - Interface de comparação lado a lado para analisar diferenças entre solicitações originais e modificadas.

### 🎯 Manipulação de Solicitações
- **Mapeamento (Map Rules)** - Redirecione solicitações para outras URLs usando expressões regulares (Regex).
- **Simulações de Respostas (Mock Responses)** - Crie respostas fictícias com códigos de status, cabeçalhos (headers) e corpos de mensagem (body) personalizados.
- **Criador de solicitações (Composer)** - Crie e envie solicitações HTTP personalizadas para testar as suas APIs.
- **Controle de velocidade (Throttling)** - Simule conexões de rede lentas ou limitações de largura de banda.

---

## 🚀 Guia de Início Rápido

### Pré-requisitos
- **Node.js** 18 ou superior
- **Android SDK** (necessário para funções de APK patching)
- **macOS / Windows / Linux**

### Instalação e Desenvolvimento
```bash
# Clonar o repositório
git clone https://github.com/danieldev23/trafexia.git
cd trafexia

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

### Compilar para Produção
```bash
# Compilar para a plataforma atual
npm run build

# Compilar para macOS (Intel)
npm run build:mac

# Compilar para macOS (Apple Silicon - M1/M2/M3)
npm run build:mac-arm

# Compilar para Windows
npm run build:win
```
Os arquivos executáveis gerados serão salvos na pasta `dist-electron/`.

---

## 📖 Guia de Configuração Móvel

### Configuração no Android

#### Passo 1: Configurar o Proxy
1. Abra **Configurações** → **Wi-Fi**.
2. Toque e segure na rede conectada e selecione **Modificar rede**.
3. Toque em **Opções avançadas**.
4. Defina o **Proxy** como **Manual**.
5. Insira o **IP do Proxy** e a **Porta** (mostrados no Trafexia).
6. Toque em **Salvar**.

#### Passo 2: Instalar o Certificado CA
1. Baixe o certificado CA através do aplicativo Trafexia (via código QR ou link direto).
2. Vá para **Configurações** → **Segurança** → **Credenciais de segurança**.
3. Selecione **Instalar do armazenamento**.
4. Escolha o arquivo de certificado baixado para concluir a instalação.

---

### Configuração no iOS

#### Passo 1: Configurar o Proxy
1. Abra **Ajustes** → **Wi-Fi**.
2. Toque no ícone **(i)** ao lado da rede Wi-Fi conectada.
3. Role para baixo até **Configurar proxy** e selecione **Manual**.
4. Insira o **Servidor (IP)** e a **Porta** indicados no Trafexia.
5. Toque em **Salvar**.

#### Passo 2: Instalar e confiar no Certificado CA
1. Use o dispositivo iOS para baixar o perfil do certificado CA usando o link fornecido no Trafexia.
2. Abra **Ajustes** → **Perfil descarregado** e prossiga com a instalação.
3. Vá para **Ajustes** → **Geral** → **Informações** → **Ajustes de confiança dos certificados**.
4. Ative a confiança total para o certificado do Trafexia CA.

---

## 🔒 Segurança e Privacidade
- **Utilize esta ferramenta exclusivamente para o desenvolvimento e testes de segurança em seus próprios dispositivos ou aplicações autorizadas.**
- **Certifique-se de remover o certificado CA de seu dispositivo assim que concluir os testes.**
- Não utilize esta ferramenta para atividades ilegais ou interceptação não autorizada de dados.

## 📄 Licencia
Este projeto está licenciado sob a **Trafexia Source-Available License**. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.
