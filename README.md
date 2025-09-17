PayPal-like minimal API (JSON storage)

How to run:
1. cd paypal_src
2. npm install
3. node server.js  (or npm start)

Available endpoints:
POST /auth/register  { name, email, password }
POST /auth/login     { email, password } -> returns token
GET  /accounts/me    Authorization: Bearer <token>
POST /accounts/deposit  { amount }  (mock deposit)
POST /transactions/send   { toEmail, amount }  Authorization Bearer
GET  /transactions/history  Authorization Bearer
POST /transactions/refund  { transactionId } Authorization Bearer
