const express = require('express');
const router = express.Router();
const storage = require('../models/storage');
const requireAuth = require('../middlewares/auth_mw');
const { v4: uuidv4 } = require('uuid');

const ACCOUNTS_FILE = 'accounts.json';
const TRANSACTIONS_FILE = 'transactions.json';

// get my account/balance
router.get('/me', requireAuth, (req, res) => {
  const accounts = storage.read(ACCOUNTS_FILE);
  const acc = accounts.find(a => a.userId === req.user.id);
  if (!acc) return res.status(404).json({ error: 'account not found' });
  res.json(acc);
});

// mock deposit to account (admin/test)
router.post('/deposit', requireAuth, (req, res) => {
  const { amount } = req.body;
  if (typeof amount !== 'number' || amount <= 0) return res.status(400).json({ error: 'invalid amount' });
  const accounts = storage.read(ACCOUNTS_FILE);
  const accIdx = accounts.findIndex(a => a.userId === req.user.id);
  if (accIdx === -1) return res.status(404).json({ error: 'account not found' });
  accounts[accIdx].balance = Number(accounts[accIdx].balance) + Number(amount);
  storage.write(ACCOUNTS_FILE, accounts);

  // create transaction record (deposit)
  const txs = storage.read(TRANSACTIONS_FILE);
  txs.push({
    id: uuidv4(),
    type: 'deposit',
    from: null,
    to: accounts[accIdx].id,
    amount: Number(amount),
    currency: accounts[accIdx].currency,
    createdAt: new Date().toISOString()
  });
  storage.write(TRANSACTIONS_FILE, txs);

  res.json({ message: 'deposit successful', balance: accounts[accIdx].balance });
});

module.exports = router;
