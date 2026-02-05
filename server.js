require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// ===============================
// CONFIG
// ===============================
const PORT = process.env.PORT || 3000;

// LINE
const LINE_PUSH_URL = 'https://api.line.me/v2/bot/message/push';
const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const LINE_USER_ID = process.env.LINE_USER_ID;

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

  // ===== Lark URL verification =====
  if (body?.type === 'url_verification' && body?.challenge) {
    return res.json({ challenge: body.challenge });
  }

  console.log('\n📨 LARK WEBHOOK RECEIVED');
  console.log(JSON.stringify(body, null, 2));

  // ===== ดึงข้อมูลจาก Lark (JSON แบบใหม่ แยก field) =====
  const {
    ticket_id,
    ticketDate,
    title,
    symptom,
    branch,
    branch_code,
    phone,
    status
  } = body || {};

  // ===== LOG ใน server =====
  console.log('\n🎫 NEW TICKET');
  console.log(`🆔 Ticket ID : ${ticket_id || '-'}`);
  console.log(`📅 Date      : ${ticketDate || '-'}`);
  console.log(`📌 Title     : ${title || '-'}`);
  console.log(`⚙️ Symptom   : ${symptom || '-'}`);
  console.log(`🏬 Branch    : ${branch || '-'}`);
  console.log(`🏷️ Code      : ${branch_code || '-'}`);
  console.log(`📞 Phone     : ${phone || '-'}`);
  console.log(`📊 Status    : ${status || '-'}`);
  console.log('');

  // ===== LINE MESSAGE (FORMAT สวย) =====
  const lineMessage =
`🆔 Ticket ID : ${ticket_id || '-'}
📅 วันที่ : ${ticketDate || '-'}

📌 หัวข้อ : ${title || '-'}
⚙️ อาการ : ${symptom || '-'}

🏬 สาขา : ${branch || '-'}
🏷️ รหัสสาขา : ${branch_code || '-'}

📞 Phone : ${phone || '-'}
📊 Status : ${status || '-'}`;

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
