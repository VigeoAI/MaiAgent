// The Inferface for cloud
const AGENT_URL = `https://api.mai-agent.ai/`;
const CHAT_PATH = 'chat';


async function agentRequest(params, apiPath, method = 'POST') {
    const respData = await postAgentRequest(params, apiPath, method);
    const resp = await getResponse(respData);
    return resp;
}

// API Function to send a POST request to the Ollama
async function postAgentRequest(data, apiPath, method = 'POST') {
  let url = AGENT_URL + apiPath;
  try {
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json(); // Or response.text
      console.log(errorData);
    }

    return response; // Assuming the API returns JSON
  } catch (error) {
    throw error; // Rethrow or handle as needed
  }
}

// API Function to stream the response from the server
async function getResponse(response) {
  const reader = response.body.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
        break;
    }
    // Decode the received value and split by lines
    const textChunk = new TextDecoder().decode(value);
    let resp = JSON.parse(textChunk);
    return resp;
  }
}
