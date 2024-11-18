// C:\Projeto\SistemaPDCA\backend\index.js
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Servidor funcionando!');
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});