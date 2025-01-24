export const generateAIResponse = async (message: string, apiKey: string) => {
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a financial modeling assistant. Help users understand financial concepts, analyze data, and build financial models. Be precise and concise.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.2,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 402) {
        throw new Error('Your DeepSeek account has insufficient balance. Please add credits to your account.');
      }
      throw new Error(errorData.error?.message || 'Failed to generate AI response');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('AI response error:', error);
    throw error;
  }
};