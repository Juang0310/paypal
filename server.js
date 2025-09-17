const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const txRoutes = require('./routes/transactions');
const accountRoutes = require('./routes/accounts');

app.use(bodyParser.json());

app.use('/auth', authRoutes);
app.use('/accounts', accountRoutes);
app.use('/transactions', txRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`PayPal-like API running on port ${PORT}`));
