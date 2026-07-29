# Kali Cold Vault OS - Offline Crypto Storage

Aplicação web de carteira de criptomoedas offline simulada em TypeScript, React e Tailwind CSS.

---

## ⚠️ Por que a tela fica BRANCA ao abrir o `index.html` direto?

Se você baixou o código-fonte do GitHub e abriu o arquivo `index.html` diretamente no navegador, a página fica **totalmente branca**. 

**Motivo:** O projeto é escrito em **React com TypeScript (`.tsx`)**. Os navegadores não conseguem ler arquivos TypeScript diretamente sem que eles sejam compilados para JavaScript tradicional.

---

## 🚀 Como resolver e publicar / rodar o projeto

### Opção 1: Publicação Automática no GitHub Pages (Recomendado)

O projeto já inclui o arquivo de automação `.github/workflows/deploy.yml`. Para ativar o site online no GitHub:

1. Acesse o seu repositório no **GitHub**.
2. Vá em **Settings** (Configurações) > **Pages**.
3. Em **Source** (Fonte), selecione **GitHub Actions**.
4. Faça um commit/push ou execute o workflow na aba **Actions**.
5. O GitHub irá gerar o build automaticamente e fornecer o link do seu site funcionando!

---

### Opção 2: Gerar a pasta `dist/` localmente (Build de Produção)

Para gerar os arquivos finais compilados em HTML/JS/CSS que funcionam em qualquer hospedagem:

1. Certifique-se de ter o **Node.js** instalado em seu computador.
2. Abra o terminal na pasta do projeto e instale as dependências:
   ```bash
   npm install
   ```
3. Execute o comando de build:
   ```bash
   npm run build
   ```
4. Uma pasta chamada **`dist/`** será criada no projeto. **Esta pasta contém o site pronto para produção!**
5. Você pode enviar todo o conteúdo interno da pasta `dist/` para a sua hospedagem (Netlify, Vercel, Hostinger, cPanel, etc.).

---

### Opção 3: Rodar o projeto em modo de desenvolvimento (Localhost)

Para rodar e testar o projeto no seu computador:

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Inicie o servidor local:
   ```bash
   npm run dev
   ```
3. Acesse o endereço exibido no terminal (ex: `http://localhost:3000`).

---

## 🐉 Solução para Kali Linux / Debian (`Unable to locate package npm`)

### Se você baixou a pasta `artifact` do GitHub Actions:
Você já tem os arquivos compilados! Não precisa do Node.js. O Kali Linux tem o **Python** pré-instalado:

1. No terminal, dentro de `~/Downloads/artifact`, rode:
   ```bash
   python3 -m http.server 8080
   ```
2. Abra o seu navegador (Firefox) e acesse: `http://localhost:8080`

### Se você precisa instalar o Node.js e o NPM no Kali Linux:
O erro `Unable to locate package npm` ocorre porque a lista do `apt` precisa ser atualizada primeiro:

```bash
sudo apt update
sudo apt install -y nodejs npm
```
Em seguida, rode novamente `npm install` na pasta do código-fonte.
