export async function callOpenRouterVision(
  base64Image: string,
  prompt: string,
  options?: {
    model?: string;
    temperature?: number;
    jsonMode?: boolean;
    maxTokens?: number;
  }
) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set in environment variables");
  }

  // Determine mime type from base64 header or default to jpeg
  let imageUrl = base64Image;
  if (imageUrl.startsWith("data:application/octet-stream")) {
    imageUrl = imageUrl.replace("data:application/octet-stream", "data:image/jpeg");
  } else if (!imageUrl.startsWith("data:")) {
    imageUrl = `data:image/jpeg;base64,${base64Image}`;
  }

  const model = options?.model || "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free";
  
  const messages = [
    {
      role: "user",
      content: [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: imageUrl } }
      ]
    }
  ];

  const body: any = {
    model,
    messages,
    temperature: options?.temperature ?? 0.7,
  };

  if (options?.jsonMode) {
    body.response_format = { type: "json_object" };
  }
  if (options?.maxTokens) {
    body.max_tokens = options.maxTokens;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout
  
  let resultText = "";
  let success = false;
  
  const isDeepfakeCheck = prompt.toLowerCase().includes("deepfake") || 
                          prompt.toLowerCase().includes("ai generated") || 
                          prompt.toLowerCase().includes("ai image") ||
                          prompt.toLowerCase().includes("fake");

  let modelToUse = options?.model || "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free";
  
  if (isDeepfakeCheck) {
    modelToUse = "sourceful/riverflow-v2.5-pro:free";
  }

  const fallbackModels = isDeepfakeCheck 
    ? [
        "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free"
      ]
    : [
        modelToUse,
        "google/gemma-4-31b-it:free",
        "google/gemma-4-26b-a4b-it:free"
      ];

  for (const currentModel of fallbackModels) {
    try {
      body.model = currentModel;
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      
      if (response.ok) {
        const data = await response.json();
        resultText = data.choices[0].message.content;
        success = true;
        break;
      } else {
        const errText = await response.text();
        console.warn(`[Vision] Model ${currentModel} failed with status ${response.status}: ${errText}`);
      }
    } catch (e: any) {
       console.warn(`[Vision] Model ${currentModel} threw error: ${e.message}`);
    }
  }
  
  clearTimeout(timeout);

  if (!success) {
    throw new Error("Vision Agent and fallback models are currently experiencing high traffic or rate limits. Please try again in a few minutes 😓");
  }

  return resultText;
}
