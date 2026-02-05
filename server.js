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

  // ===== ดึงข้อมูลจาก Lark =====
  const {
    ticket_id,
    title,
    branch,
    phone,
    status
  } = body || {};

  // ===== แยกข้อมูล (ตาม format เดิมของคุณ) =====
  // ticket_id: Ticket-046/2026/02/05 14:23
  const ticketId = ticket_id?.split('/')[0] || '-';
  const ticketDate = ticket_id?.split('/').slice(1).join('/') || '-';

  // title: อินเตอร์เน็ต/ทดสอบอาการ
  const [mainTitle, symptom] = title?.split('/') || ['-', '-'];

  // branch: ABP/0002
  const [branchName, branchCode] = branch?.split('/') || ['-', '-'];

  // ===== LOG ใน server =====
  console.log('\n🎫 NEW TICKET');
  console.log(`🆔 Ticket ID : ${ticketId}`);
  console.log(`📅 Date      : ${ticketDate}`);
  console.log(`📌 Title     : ${mainTitle}`);
  console.log(`⚙️ Symptom   : ${symptom}`);
  console.log(`🏬 Branch    : ${branchName}`);
  console.log(`🏷️ Code      : ${branchCode}`);
  console.log(`📞 Phone     : ${phone || '-'}`);
  console.log(`📊 Status    : ${status || '-'}`);
  console.log('');

  // ===== LINE MESSAGE (FORMAT สวย) =====
  const lineMessage =
`🆔 Ticket ID : ${ticketId}
📅 วันที่ : ${ticketDate}

📌 หัวข้อ : ${mainTitle}
⚙️ อาการ : ${symptom}

🏬 สาขา : ${branchName}
🏷️ รหัสสาขา : ${branchCode}

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
