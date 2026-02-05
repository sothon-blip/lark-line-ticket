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
const LINE_REPLY_URL = 'https://api.line.me/v2/bot/message/reply';
const LINE_PROFILE_URL = 'https://api.line.me/v2/bot/profile';

const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

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

  // Lark verify URL
  if (body?.type === 'url_verification' && body?.challenge) {
    return res.json({ challenge: body.challenge });
  }

  console.log('\n📨 LARK WEBHOOK RECEIVED');
  console.log(JSON.stringify(body, null, 2));

  // ===== ดึงข้อมูลจาก Lark (JSON ใหม่ของคุณ) =====
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


app.post('/line/webhook', (req, res) => {
  console.log('📩 LINE WEBHOOK RECEIVED');
  console.log(JSON.stringify(req.body, null, 2));
  res.status(200).send('OK');
});


  // ===== LOG =====
  console.log('\n🎫 NEW TICKET');
  console.log(`🆔 Ticket ID : ${ticket_id}`);
  console.log(`📅 Date      : ${ticketDate}`);
  console.log(`📌 Title     : ${title}`);
  console.log(`⚙️ Symptom   : ${symptom}`);
  console.log(`🏬 Branch    : ${branch}`);
  console.log(`🏷️ Code      : ${branch_code}`);
  console.log(`📞 Phone     : ${phone}`);
  console.log(`📊 Status    : ${status}`);
  console.log('');

  // ===== LINE MESSAGE =====
  const lineMessage =
`🆔 Ticket ID : ${ticket_id}
📅 วันที่ : ${ticketDate}

📌 หัวข้อ : ${title}
⚙️ อาการ : ${symptom}

🏬 สาขา : ${branch}
🏷️ รหัสสาขา : ${branch_code}

📞 Phone : ${phone}
📊 Status : ${status}`;

  try {
    await axios.post(
      LINE_PUSH_URL,
      {
        to: process.env.LINE_USER_ID, // ผู้รับหลัก
        messages: [{ type: 'text', text: lineMessage }]
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
// LINE WEBHOOK (VERIFY + MESSAGE)
// ===============================
app.post('/line/webhook', async (req, res) => {
  const events = req.body.events || [];

  // ⭐ ตอบ LINE ทันที (กัน timeout)
  res.sendStatus(200);

  for (const event of events) {
    if (event.type !== 'message') continue;

    const replyToken = event.replyToken;
    const source = event.source;

    const userId = source.userId;
    const groupId = source.groupId || null;

    let userName = 'Unknown';

    // ===== ดึงชื่อ USER (กรณีคุยส่วนตัว) =====
    if (source.type === 'user') {
      try {
        const profile = await axios.get(
          `${LINE_PROFILE_URL}/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${LINE_TOKEN}`
            }
          }
        );
        userName = profile.data.displayName;
      } catch (err) {
        console.error('❌ GET PROFILE ERROR');
      }
    }

    // ===== FORMAT ข้อความตอบ =====
    let replyText =
`👤 User Name LINE : ${userName}
🆔 User ID : ${userId}`;

    if (groupId) {
      replyText += `\n👥 Group ID : ${groupId}`;
    }

    // ===== REPLY =====
    await axios.post(
      LINE_REPLY_URL,
      {
        replyToken,
        messages: [{ type: 'text', text: replyText }]
      },
      {
        headers: {
          Authorization: `Bearer ${LINE_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ LINE REPLY SENT');
  }
});

// ===============================
// START SERVER
// ===============================
app.listen(PORT, () => {
  console.log(`🚀 SERVER STARTED : PORT ${PORT}`);
});
