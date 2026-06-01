const express = require('express');
const axios = require('axios');
const cors = require('cors');
const WebSocket = require('ws');

const app = express();
app.use(express.json());
app.use(cors());

const CLIENT_ID = '33qw17TW2WM9OqeTqtRaC';
const REDIRECT_URI = 'https://gentle-duckanoo-8e457f.netlify.app/callback.html';

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
        console.log("✅ Token obtido com sucesso!");

        // INICIA O ROBÔ ASSIM QUE O TOKEN CHEGA
        iniciarEstrategiaDoBot(accessToken);

        res.json({ status: "sucesso", message: "Bot iniciado!" });
    } catch (error) {
        console.error("Erro na troca de token:", error.response?.data || error.message);
        res.status(500).json({ error: "Falha ao obter token" });
    }
});

function iniciarEstrategiaDoBot(token) {
    const app_id = '33qw17TW2WM9OqeTqtRaC';
    const ws = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${app_id}`);

    ws.on('open', () => {
        console.log("🌐 Robô Conectado à Deriv via WebSocket!");
        ws.send(JSON.stringify({ "authorize": token }));
    });

    ws.on('message', (data) => {
        const response = JSON.parse(data);

        if (response.msg_type === 'authorize') {
            console.log("✅ Conta Autorizada! Saldo: " + response.authorize.balance);
            // Solicita preços em tempo real do Volatility 100
            ws.send(JSON.stringify({ "ticks": "R_100" }));
        }

        if (response.msg_type === 'tick') {
            console.log("📈 Preço V100: " + response.tick.quote);
            // AQUI VOCÊ COLOCA SUA LÓGICA DE COMPRA/VENDA NO FUTURO
        }
    });

    ws.on('error', (err) => console.log("❌ Erro no Bot:", err));
}

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));