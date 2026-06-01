const express = require('express');
const axios = require('axios');
const cors = require('cors');
const WebSocket = require('ws');

const app = express();
app.use(express.json());
app.use(cors());

// --- CONFIGURAÇÕES OFICIAIS DO GARRABOT ---
const CLIENT_ID = '33qw17TW2WM9OqeTqtRaC';
const REDIRECT_URI = 'https://gentle-duckanoo-8e457f.netlify.app/callback.html';
// ------------------------------------------

app.post('/auth/deriv', async (req, res) => {
    const { code, verifier } = req.body;

    if (!code || !verifier) {
        return res.status(400).json({ error: "Código ou Verificador ausentes." });
    }

    try {
        // 1. Troca o código de autorização pelo Access Token oficial
        const response = await axios.post('https://auth.deriv.com/oauth2/token', new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: CLIENT_ID,
            code: code,
            code_verifier: verifier,
            redirect_uri: REDIRECT_URI
        }));
        
        const accessToken = response.data.access_token;
        console.log("✅ Token obtido com sucesso!");

        // 2. Inicia o robô com o token recebido
        iniciarEstrategiaDoBot(accessToken);

        res.json({ status: "sucesso", message: "GARRABot iniciado no servidor!" });

    } catch (error) {
        const erroMsg = error.response?.data || error.message;
        console.error("❌ Erro na troca de token:", erroMsg);
        res.status(500).json({ error: "Falha na autenticação com a Deriv" });
    }
});

// FUNÇÃO DO ROBÔ (WEBSOCKET)
function iniciarEstrategiaDoBot(token) {
    // Usamos o App ID 1089 (Padrão da Deriv para conexões via Token)
    const APP_ID_WS = '1089'; 
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID_WS}`);

    ws.on('open', () => {
        console.log("🌐 Conectando ao WebSocket da Deriv...");
        // Envia o comando de autorização com o token do cliente
        ws.send(JSON.stringify({ "authorize": token }));
    });

    ws.on('message', (data) => {
        const response = JSON.parse(data);

        // Resposta da Autorização
        if (response.msg_type === 'authorize') {
            if (response.error) {
                console.log("❌ Erro na autorização:", response.error.message);
            } else {
                console.log("✅ CONTA AUTORIZADA!");
                console.log("💰 Saldo Atual: " + response.authorize.balance + " " + response.authorize.currency);
                
                // Exemplo: O robô começa a monitorar o índice Volatility 100
                ws.send(JSON.stringify({ "ticks": "R_100" }));
            }
        }

        // Resposta dos Preços em Tempo Real (Ticks)
        if (response.msg_type === 'tick') {
            console.log(`📈 Ativo: ${response.tick.symbol} | Preço: ${response.tick.quote}`);
            
            // AQUI VOCÊ PODE ADICIONAR SUA LÓGICA DE TRADING
            // Exemplo: if (preço > valor) { comprar() }
        }
    });

    ws.on('error', (err) => {
        console.log("❌ Erro no WebSocket:", err.message);
    });

    ws.on('close', () => {
        console.log("🔌 Conexão com a Deriv fechada.");
    });
}

// O Render exige que o servidor escute em uma porta (padrão 10000)
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 GARRABot rodando na porta ${PORT}`);
});