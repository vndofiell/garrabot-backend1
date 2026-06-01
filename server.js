const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// --- CONFIGURAÇÕES DO GARRABOT ---
const CLIENT_ID = '33qw17TW2WM9OqeTqtRaC';
const REDIRECT_URI = 'https://gentle-duckanoo-8e457f.netlify.app/callback.html';

// Variável para guardar o token temporariamente até o robô buscar
let tokenTemporario = null;

// 1. ROTA QUE RECEBE O LOGIN DO SITE (Navegador)
app.post('/auth/deriv', async (req, res) => {
    const { code, verifier } = req.body;

    try {
        const response = await axios.post('https://auth.deriv.com/oauth2/token', new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: CLIENT_ID,
            code: code,
            code_verifier: verifier,
            redirect_uri: REDIRECT_URI
        }));
        
        const accessToken = response.data.access_token;
        
        // Guarda o token na memória para o robô buscar
        tokenTemporario = accessToken;

        console.log("✅ Token recebido do navegador e armazenado para o robô!");
        res.json({ status: "sucesso", message: "Agora volte ao robô Python." });

    } catch (error) {
        console.error("❌ Erro na troca de token:", error.response?.data || error.message);
        res.status(500).json({ error: "Falha na autenticação" });
    }
});

// 2. ROTA QUE O ROBÔ PYTHON CHAMA PARA BUSCAR O TOKEN
app.get('/pegar-token-robo', (req, res) => {
    if (tokenTemporario) {
        console.log("📤 Entregando token para o robô Python...");
        res.json({ token: tokenTemporario });
        
        // Limpa o token após entregar por segurança
        tokenTemporario = null; 
    } else {
        // Se o robô perguntar e ainda não houver login
        res.status(404).json({ error: "Aguardando login no navegador..." });
    }
});

// Rota simples para conferir se o servidor está vivo
app.get('/', (req, res) => {
    res.send("🚀 Servidor Ponte do GARRABot está Online!");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Ponte GARRABot rodando na porta ${PORT}`);
});