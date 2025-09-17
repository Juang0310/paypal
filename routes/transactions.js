const express = require('express');
const router = express.Router();
const storage = require('../models/storage');
const requireAuth = require('../middlewares/auth_mw');
const { v4: uuidv4 } = require('uuid');

const ACCOUNTS_FILE = 'accounts.json';
const TRANSACTIONS_FILE = 'transactions.json';

// send payment from authenticated user's account to another user's email
router.post('/send', requireAuth, (req, res) => {
  const { toEmail, amount } = req.body;
  if (!toEmail || typeof amount !== 'number' || amount <= 0) return res.status(400).json({ error: 'toEmail and positive amount required' });
  const users = storage.read('users.json');
  const recipient = users.find(u => u.email === toEmail);
  if (!recipient) return res.status(404).json({ error: 'recipient not found' });

  const accounts = storage.read(ACCOUNTS_FILE);
  const senderAcc = accounts.find(a => a.userId === req.user.id);
  const recipientAcc = accounts.find(a => a.userId === recipient.id);
  if (!senderAcc || !recipientAcc) return res.status(404).json({ error: 'account not found' });
  if (Number(senderAcc.balance) < Number(amount)) return res.status(400).json({ error: 'insufficient funds' });

  senderAcc.balance = Number(senderAcc.balance) - Number(amount);
  recipientAcc.balance = Number(recipientAcc.balance) + Number(amount);
  storage.write(ACCOUNTS_FILE, accounts);

  const txs = storage.read(TRANSACTIONS_FILE);
  const tx = {
    id: uuidv4(),
    type: 'payment',
    from: senderAcc.id,
    to: recipientAcc.id,
    amount: Number(amount),
    currency: senderAcc.currency,
    createdAt: new Date().toISOString(),
    status: 'completed'
  };
  txs.push(tx);
  storage.write(TRANSACTIONS_FILE, txs);
  res.json({ message: 'payment sent', transaction: tx });
});

// get history for my account
router.get('/history', requireAuth, (req, res) => {
  const accounts = storage.read(ACCOUNTS_FILE);
  const acc = accounts.find(a => a.userId === req.user.id);
  if (!acc) return res.status(404).json({ error: 'account not found' });
  const txs = storage.read(TRANSACTIONS_FILE);
  const myTxs = txs.filter(t => t.from === acc.id || t.to === acc.id);
  res.json({ transactions: myTxs });
});

// refund (simple): can refund a transaction if exists and to our account
router.post('/refund', requireAuth, (req, res) => {
  const { transactionId } = req.body;
  if (!transactionId) return res.status(400).json({ error: 'transactionId required' });
  const txs = storage.read(TRANSACTIONS_FILE);
  const tx = txs.find(t => t.id === transactionId);
  if (!tx) return res.status(404).json({ error: 'transaction not found' });
  // only payments can be refunded and requester must be recipient
  const accounts = storage.read(ACCOUNTS_FILE);
  const acc = accounts.find(a => a.userId === req.user.id);
  if (!acc) return res.status(404).json({ error: 'account not found' });
  if (tx.type !== 'payment') return res.status(400).json({ error: 'only payments can be refunded' });
  if (tx.to !== acc.id) return res.status(403).json({ error: 'only recipient can request refund' });

  // reverse funds
  const senderAcc = accounts.find(a => a.id === tx.from);
  const recipientAcc = accounts.find(a => a.id === tx.to);
  if (!senderAcc || !recipientAcc) return res.status(500).json({ error: 'account missing for tx' });
  if (Number(recipientAcc.balance) < Number(tx.amount)) return res.status(400).json({ error: 'recipient has insufficient balance for refund' });

  recipientAcc.balance = Number(recipientAcc.balance) - Number(tx.amount);
  senderAcc.balance = Number(senderAcc.balance) + Number(tx.amount);
  storage.write(ACCOUNTS_FILE, accounts);

  // create refund tx
  const refundTx = {
    id: uuidv4(),
    type: 'refund',
    from: recipientAcc.id,
    to: senderAcc.id,
    amount: Number(tx.amount),
    currency: tx.currency,
    createdAt: new Date().toISOString(),
    relatedTo: tx.id
  };
  txs.push(refundTx);
  storage.write(TRANSACTIONS_FILE, txs);

  res.json({ message: 'refund completed', refund: refundTx });
});

module.exports = router;
