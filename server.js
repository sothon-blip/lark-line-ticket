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
const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const LINE_USER_ID = process.env.LINE_USER_ID;

// ===============================
// HEALTH CHECK (Render / Verify)
// ===============================
app.get('/', (req, res) => {
  res.status(200).send('SERVER OK');
});

// ===============================
// LARK WEBHOOK
// ===============================
app.post('/lark/webhook', async (req, res) => {
  try {
    const body = req.body;

    // Lark verify
    if (body?.type === 'url_verification' && body?.challenge) {
      console.log('🔐 LARK VERIFY');
      return res.json({ challenge: body.challenge });
    }

    console.log('\n📨 LARK WEBHOOK RECEIVED');
    console.log(JSON.stringify(body, null, 2));

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

    console.log('\n🎫 NEW TICKET (LARK)');
    console.log(`🆔 Ticket ID : ${ticket_id}`);
    console.log(`📅 Date      : ${ticketDate}`);
    console.log(`📌 Title     : ${title}`);
    console.log(`⚙️ Symptom   : ${symptom}`);
    console.log(`🏬 Branch    : ${branch}`);
    console.log(`🏷️ Code      : ${branch_code}`);
    console.log(`📞 Phone     : ${phone}`);
    console.log(`📊 Status    : ${status}`);
    console.log('--------------------------------');

    const lineMessage =
`🆔 Ticket ID : ${ticket_id}
📅 วันที่ : ${ticketDate}

📌 หัวข้อ : ${title}
⚙️ อาการ : ${symptom}

🏬 สาขา : ${branch}
🏷️ รหัสสาขา : ${branch_code}

📞 Phone : ${phone}
📊 Status : ${status}`;

    await axios.post(
      LINE_PUSH_URL,
      {
        to: LINE_USER_ID,
        messages: [{ type: 'text', text: lineMessage }]
      },
      {
        headers: {
          Authorization: `Bearer ${LINE_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ LINE PUSH SUCCESS (from LARK)');
    res.json({ code: 0 });
  } catch (err) {
    console.error('❌ LARK ERROR', err.message);
    res.json({ code: 0 });
  }
});

// ===============================
// LINE WEBHOOK
// ===============================
app.post('/line/webhook', async (req, res) => {
  try {
    // สำคัญมาก: LINE Verify จะไม่มี events
    if (!req.body || !Array.isArray(req.body.events)) {
      console.log('🔎 LINE VERIFY / EMPTY EVENT');
      return res.sendStatus(200);
    }

    const event = req.body.events[0];
    if (!event) return res.sendStatus(200);

    const source = event.source || {};
    const userId = source.userId || '-';
    const groupId = source.groupId || null;
    const replyToken = event.replyToken;
    const text = event.message?.text || '-';

    // ===== LOG ให้ตรงกับแชท =====
    console.log('\n💬 LINE MESSAGE RECEIVED');
    console.log(`👤 User ID  : ${userId}`);
    if (groupId) console.log(`👥 Group ID : ${groupId}`);
    console.log(`📝 Message : ${text}`);
    console.log('--------------------------------');

    // ===== ตอบกลับ LINE =====
    const replyText =
groupId
? `👤 User Name LINE : Unknown
🆔 User ID : ${userId}
👥 Group ID : ${groupId}`
: `👤 User Name LINE : Tae
🆔 User ID : ${userId}`;

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
    res.sendStatus(200);
  } catch (err) {
    console.error('❌ LINE WEBHOOK ERROR', err.message);
    res.sendStatus(200); // ห้าม throw เด็ดขาด
  }
});

// ===============================
// START SERVER
// ===============================
app.listen(PORT, () => {
  console.log(`🚀 SERVER STARTED : PORT ${PORT}`);
});
