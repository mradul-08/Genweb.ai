const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": "Bearer e0f3da066cfa44018ace276453785366",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "glm-4.5-air",
    messages: [{ role: "user", content: "say hi" }],
    max_tokens: 10
  })
})

const data = await response.json()
console.log(JSON.stringify(data, null, 2))