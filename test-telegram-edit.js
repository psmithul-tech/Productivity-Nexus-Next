const token = "3Eeb6dVpzefurG4LHhIRUf3p6t6_3wDJmve1WHuDt8eQxLbBp"; // User's bot token from earlier logs
const chatId = "6284351149";
async function run() {
  const res1 = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: "Test message" }),
  });
  const data1 = await res1.json();
  console.log("Send:", data1);

  const res2 = await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, message_id: data1.result.message_id, text: "Test message" }),
  });
  const data2 = await res2.json();
  console.log("Edit identical:", data2);
}
run();
