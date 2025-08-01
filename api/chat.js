const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { body } = req;

    const openRouterResponse = await fetch("https://openrouter.ai/api/v1/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          req.headers.origin || "https://chatbot-rosy-mu.vercel.app/",
        "X-Title": "AI Chat App",
      },
      body: JSON.stringify(body),
    });

    const data = await openRouterResponse.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
};
