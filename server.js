// ===============================
// LINE WEBHOOK
// ===============================
app.post('/line/webhook', async (req, res) => {
  const event = req.body?.events?.[0];

  if (!event) {
    console.log('⚠️ LINE: No event');
    return res.sendStatus(200);
  }

  const source = event.source || {};
  const userId = source.userId || '-';
  const groupId = source.groupId || null;

  // ===== LOG ตรงกับที่เห็นในแชท =====
  console.log('\n💬 LINE MESSAGE RECEIVED');
  console.log(`👤 User ID  : ${userId}`);
  if (groupId) {
    console.log(`👥 Group ID : ${groupId}`);
  }
  console.log(`📝 Message : ${event.message?.text || '-'}`);
  console.log('--------------------------------');

  // ===== ดึงชื่อผู้ใช้ (เฉพาะ 1:1) =====
  let userName = 'Unknown';
  if (source.type === 'user') {
    try {
      const profile = await axios.get(
        `https://api.line.me/v2/bot/profile/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${LINE_TOKEN}`,
          },
        }
      );
      userName = profile.data.displayName;
    } catch (e) {
      console.log('⚠️ Cannot fetch LINE profile');
    }
  }

  // ===== ส่งข้อความกลับ =====
  const replyText =
`👤 User Name LINE : ${userName}
🆔 User ID : ${userId}${groupId ? `\n👥 Group ID : ${groupId}` : ''}`;

  try {
    await axios.post(
      'https://api.line.me/v2/bot/message/reply',
      {
        replyToken: event.replyToken,
        messages: [{ type: 'text', text: replyText }],
      },
      {
        headers: {
          Authorization: `Bearer ${LINE_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (err) {
    console.error('❌ LINE REPLY ERROR', err.response?.data || err.message);
  }

  res.sendStatus(200);
});
