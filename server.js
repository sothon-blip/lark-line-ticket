require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// ================= CONFIG =================
const PORT = process.env.PORT || 3000;
const LINE_PUSH_URL = 'https://api.line.me/v2/bot/message/push';
const LINE_REPLY_URL = 'https://api.line.me/v2/bot/message/reply';
const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

// ================= HELPER =================
async function pushLine(to, text) {
  return axios.post(
    LINE_PUSH_URL,
    { to, messages: [{ type: 'text', text }] },
    { headers: { Authorization: `Bearer ${LINE_TOKEN}` } }
  );
}

async function replyLine(replyToken, text) {
  return axios.post(
    LINE_REPLY_URL,
    { replyToken, messages: [{ type: 'text', text }] },
    { headers: { Authorization: `Bearer ${LINE_TOKEN}` } }
  );
}

// ================= HEALTH =================
app.get('/', (_, res) => res.status(200).send('SERVER OK'));

// ================= WEBHOOK =================
app.post('/lark/webhook', async (req, res) => {
  const body = req.body || {};
  console.log('\n📥 WEBHOOK RECEIVED');
  console.log(JSON.stringify(body, null, 2));

  // ตอบ 200 ทันที กัน retry / timeout
  res.status(200).json({ ok: true });

  // =====================================================
  // 1) LINE USER MESSAGE
  // =====================================================
  if (body.type === 'line_event') {
    const {
      replyToken,
      message,
      user_id,
      group_id,
      user_name
    } = body;

    console.log('\n💬 LINE MESSAGE');
    console.log(`👤 User ID  : ${user_id}`);
    console.log(`👥 Group ID : ${group_id || '-'}`);
    console.log(`✉️ Message  : ${message}`);

    const replyText =
`📨 ข้อความของคุณคือ:
${message}

👤 User ID : ${user_id}
👤 User Name : ${user_name || 'Unknown'}
👥 Group ID : ${group_id || '-'}`;

    try {
      await replyLine(replyToken, replyText);
      console.log('✅ LINE REPLY SENT');
    } catch (e) {
      console.error('❌ LINE REPLY ERROR', e.response?.data || e.message);
    }
    return;
  }

  // =====================================================
  // 2) DAILY REPORT (จาก Lark Trigger)
  // =====================================================
  if (body.type === 'daily_report') {
    const {
      time,
      pending_count,
      inprogress_count,
      line_user_id,
      line_group_id
    } = body;

    const target = line_user_id || line_group_id;
    if (!target) {
      console.error('❌ DAILY REPORT: no target');
      return;
    }

    console.log('\n📊 DAILY REPORT');
    console.log(`⏰ Time        : ${time}`);
    console.log(`🟡 Pending    : ${pending_count}`);
    console.log(`🔵 InProgress : ${inprogress_count}`);
    console.log(`🎯 Send to    : ${target}`);

    const msg =
`📋 รายงานงานคงเหลือ
⏰ รอบเวลา : ${time}

🟡 รอดำเนินการ : ${pending_count}
🔵 อยู่ระหว่างดำเนินการ : ${inprogress_count}`;

    try {
      await pushLine(target, msg);
      console.log('✅ DAILY REPORT SENT');
    } catch (e) {
      console.error('❌ DAILY REPORT ERROR', e.response?.data || e.message);
    }
    return;
  }

  // =====================================================
  // 3) TICKET NOTIFY
  // =====================================================
  if (body.type === 'ticket') {
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

    const target = line_user_id || line_group_id;
    if (!target) {
      console.error('❌ TICKET: no target');
      return;
    }

    console.log('\n🎫 NEW TICKET');
    console.log(`🆔 ${ticket_id}`);
    console.log(`📅 ${ticketDate}`);
    console.log(`📌 ${title}`);
    console.log(`⚙️ ${symptom}`);
    console.log(`🏬 ${branch}`);
    console.log(`🏷️ ${branch_code}`);
    console.log(`📞 ${phone}`);
    console.log(`📊 ${status}`);
    console.log(`🎯 Send to ${target}`);

    const msg =
`🆔 Ticket ID : ${ticket_id}
📅 วันที่ : ${ticketDate}

📌 หัวข้อ : ${title}
⚙️ อาการ : ${symptom}

🏬 สาขา : ${branch}
🏷️ รหัสสาขา : ${branch_code}

📞 Phone : ${phone}
📊 Status : ${status}`;

    try {
      await pushLine(target, msg);
      console.log('✅ TICKET SENT');
    } catch (e) {
      console.error('❌ TICKET ERROR', e.response?.data || e.message);
    }
    return;
  }

  console.warn('⚠️ UNKNOWN PAYLOAD TYPE');
});

// ================= START =================
app.listen(PORT, () => {
  console.log(`🚀 SERVER STARTED : PORT ${PORT}`);
});
