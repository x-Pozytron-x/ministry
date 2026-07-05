$prompt = @"
You are a code editor agent.

TASK:
Edit file Attendance.tsx.

RULES:
- Return ONLY full updated file content
- Do not explain
- Do not add markdown
- Keep logic consistent

CODE:
$(Get-Content .\src\components\Attendance.tsx -Raw)
"@

Invoke-RestMethod `
  -Uri "http://localhost:1234/v1/chat/completions" `
  -Method POST `
  -ContentType "application/json" `
  -Body (@{
    model = "gemma-4-12b-it-qat"
    messages = @(@{ role="user"; content=$prompt })
    temperature = 0.2
  } | ConvertTo-Json -Depth 10)