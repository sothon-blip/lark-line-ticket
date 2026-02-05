require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// ===============================
// CONFIG
// ===============================
const PORT = 3000;

// LINE
const LINE_PUSH_URL = 'https://api.line.me/v2/bot/message/push';
const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const LINE_USER_ID = 'U70a054e1c503d6195eb0417e5422011e';

// ===============================
// HEALTH CHECK
// ===============================
app.get('/', (req, res) => {
  res.send('SERVER OK');
});

// ===============================
// LARK WEBHOOK
// ===============================
app.post('/lark/webhook', async (req, res) => {
  const body = req.body;

  // ✅ สำหรับ Lark verify URL
  if (body.type === 'url_verification' && body.challenge) {
    return res.json({ challenge: body.challenge });
  }

  console.log('\n📨 LARK WEBHOOK RECEIVED');
  console.log(JSON.stringify(body, null, 2));

  // ===== ดึงข้อมูลจาก Lark Automation =====
  const {
    ticket_id,
    title,
    branch,
    phone,
    status
  } = body || {};

  // ===== แสดงผล CMD (ตามที่ต้องการ) =====
  console.log('\n🎫 NEW TICKET');
  console.log(`🆔 Ticket ID : ${ticket_id || '-'}`);
  console.log(`📌 Title     : ${title || '-'}`);
  console.log(`🏬 Branch    : ${branch || '-'}`);
  console.log(`📞 Phone     : ${phone || '-'}`);
  console.log(`📊 Status    : ${status || '-'}`);
  console.log('');

  // ===== ข้อความส่งเข้า LINE =====
  const lineMessage =
`🎫 NEW TICKET
🆔 Ticket ID : ${ticket_id || '-'}
📌 Title     : ${title || '-'}
🏬 Branch    : ${branch || '-'}
📞 Phone     : ${phone || '-'}
📊 Status    : ${status || '-'}`;

  // ===== PUSH เข้า LINE =====
  try {
    await axios.post(
      LINE_PUSH_URL,
      {
        to: LINE_USER_ID,
        messages: [
          {
            type: 'text',
            text: lineMessage
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${LINE_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ LINE PUSH SUCCESS');
  } catch (err) {
    console.error('❌ LINE PUSH ERROR');
    console.error(err.response?.data || err.message);
  }

  res.json({ code: 0 });
});

// ===============================
// START SERVER
// ===============================
app.listen(PORT, () => {
  console.log(`🚀 SERVER STARTED : PORT ${PORT}`);
});
