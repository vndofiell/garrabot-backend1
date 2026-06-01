const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); // Permite que seu site fale com este servidor

// Configurações da Deriv
const CLIENT_ID = '33qw17TW2WM9OqeTqtRaC';
const REDIRECT_URI = 'https://garabotfiel.com/callback'; // Deve ser igual ao do portal

// Rota que recebe o código e o verifier
app.post('/auth/deriv', async (req, res) => {
    const { code, verifier } = req.body;

    try {
        // 1. Troca o código pelo Token Real
        const response = await axios.post('https://auth.deriv.com/oauth2/token', new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: CLIENT_ID,
            code: code,
            code_verifier: verifier,
            redirect_uri: REDIRECT_URI
        }));

        const accessToken = response.data.access_token;
        console.log("✅ Token obtido com sucesso!");

        // 2. AQUI O BOT COMEÇA! 
        // Você pode chamar sua função de trade aqui passando o accessToken
        iniciarEstrategiaDoBot(accessToken);

        res.json({ status: "Conectado", message: "O robô começou a trabalhar!" });

    } catch (error) {
        console.error("Erro na troca de token:", error.response?.data || error.message);
        res.status(500).json({ error: "Falha ao obter token" });
    }
});

function iniciarEstrategiaDoBot(token) {
    console.log("🤖 Robô operando com o token: " + token.substring(0, 10) + "...");
    // Aqui você coloca a lógica de compra e venda (WebSocket)
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));