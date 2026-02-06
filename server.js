require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// ===============================
// CONFIG
// ===============================
const PORT = process.env.PORT || 3000;
const LINE_PUSH_URL = 'https://api.line.me/v2/bot/message/push';
const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

// ===============================
// HEALTH CHECK
// ===============================
app.get('/', (req, res) => {
  res.status(200).send('SERVER OK');
});

// ===============================
// LARK WEBHOOK
// ===============================
app.post('/lark/webhook', async (req, res) => {
  const body = req.body || {};

  // ตอบกลับทันที กัน retry
  res.status(200).json({ ok: true });

  // ===============================
  // DAILY REPORT (Schedule)
  // ===============================
  if (body.type === 'daily_report') {
    const {
      time,
      pending_count,
      inprogress_count,
      line_user_id,
      line_group_id
    } = body;

    const target =
      line_user_id?.trim()
        ? line_user_id
        : line_group_id?.trim()
        ? line_group_id
        : null;

    if (!target) {
      console.error('❌ DAILY REPORT: no LINE target');
      return;
    }

    console.log('\n📊 DAILY REPORT');
    console.log(`⏰ รอบเวลา : ${time}`);
    console.log(`🟡 รอดำเนินการ : ${pending_count}`);
    console.log(`🔵 อยู่ระหว่างดำเนินการ : ${inprogress_count}`);
    console.log(`🎯 LINE TO : ${target}`);
    console.log('--------------------------------');

    const reportMessage =
`📋 รายงานงานคงเหลือ
⏰ รอบเวลา : ${time}

🟡 รอดำเนินการ : ${pending_count}
🔵 อยู่ระหว่างดำเนินการ : ${inprogress_count}`;

    try {
      await axios.post(
        LINE_PUSH_URL,
        {
          to: target,
          messages: [
            { type: 'text', text: reportMessage }
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${LINE_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('✅ DAILY REPORT SENT');
    } catch (err) {
      console.error('❌ DAILY REPORT ERROR', err.response?.data || err.message);
    }

    return;
  }

  // ===============================
  // TICKET NOTIFY (Normal)
  // ===============================
  const {
    ticket_id,
    ticketDate,
    title,
    symptom,
    branch,
    branch_code,
    phone,
    status,
    line_user_id,
    line_group_id
  } = body;

  const target =
    line_user_id?.trim()
      ? line_user_id
      : line_group_id?.trim()
      ? line_group_id
      : null;

  if (!target) {
    console.error('❌ TICKET: no LINE target');
    return;
  }

  console.log('\n🎫 NEW TICKET');
  console.log(`🆔 Ticket ID : ${ticket_id}`);
  console.log(`📅 Date      : ${ticketDate}`);
  console.log(`📌 Title     : ${title}`);
  console.log(`⚙️ Symptom   : ${symptom}`);
  console.log(`🏬 Branch    : ${branch}`);
  console.log(`🏷️ Code      : ${branch_code}`);
  console.log(`📞 Phone     : ${phone}`);
  console.log(`📊 Status    : ${status}`);
  console.log(`🎯 LINE TO   : ${target}`);
  console.log('--------------------------------');

  const ticketMessage =
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
        to: target,
        messages: [
          { type: 'text', text: ticketMessage }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${LINE_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ TICKET PUSH SENT');
  } catch (err) {
    console.error('❌ TICKET PUSH ERROR', err.response?.data || err.message);
  }
});

// ===============================
// START SERVER
// ===============================
app.listen(PORT, () => {
  console.log(`🚀 SERVER STARTED : PORT ${PORT}`);
});
