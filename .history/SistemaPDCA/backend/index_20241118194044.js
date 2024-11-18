require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Conectado ao MongoDB com sucesso!');
}).catch((error) => {
    console.error('Erro ao conectar ao MongoDB', error);
});
