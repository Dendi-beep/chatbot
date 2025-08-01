export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const body =
      req.body || req.body === ""
        ? req.body
        : await new Promise((resolve) => {
            let data = "";
            req.on("data", (chunk) => {
              data += chunk;
            });
            req.on("end", () => resolve(JSON.parse(data || "{}")));
          });

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://yourdomain.com",
          "X-Title": "My Public Chat",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
