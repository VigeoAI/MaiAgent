import {
    Aptos,
    AptosConfig,
    Ed25519PrivateKey,
    HexInput,
    Network,
    PrivateKey,
    PrivateKeyVariants,
} from "@aptos-labs/ts-sdk"
import * as fs from 'fs';
// import { ChatAnthropic } from "@langchain/anthropic"
import { ChatOpenAI } from "@langchain/openai"
import { HumanMessage } from "@langchain/core/messages"
import { MemorySaver } from "@langchain/langgraph"
import { createReactAgent } from "@langchain/langgraph/prebuilt"
import { AgentRuntime, LocalSigner, createAptosTools } from "move-agent-kit"
import OpenAI from "openai";


export async function chatWithChain(msg: string): Promise<string> {
    console.log("chatWithChain");
    let response = "";
    try {
        const aptosConfig = new AptosConfig({
            network: Network.MAINNET,
        })
        const aptos = new Aptos(aptosConfig)
        const account = await aptos.deriveAccountFromPrivateKey({
            privateKey: new Ed25519PrivateKey(
                PrivateKey.formatPrivateKey(process.env.PRIVATE_KEY as HexInput, PrivateKeyVariants.Ed25519)
            ),
        })

        const signer = new LocalSigner(account, Network.MAINNET)
        const agentRuntime = new AgentRuntime(signer, aptos, {
            PANORA_API_KEY: process.env.PANORA_API_KEY,
        })
        const tools = createAptosTools(agentRuntime)

        // const llm = new ChatAnthropic({
        //     model: "claude-3-sonnet-20240229",
        // })
        const llm = new ChatOpenAI({
           apiKey: process.env.OPENAI_API_KEY,
           modelName: "gpt-4o-mini",
        });  
        const memory5 = new MemorySaver()

        const agent = createReactAgent({
            llm,
            tools,
            checkpointSaver: memory5,
            messageModifier: `
                You are a helpful agent that can interact onchain using the Aptos Agent Kit. You are
                empowered to interact onchain using your tools. If you ever need funds, you can request them from the
                faucet. If not, you can provide your wallet details and request funds from the user. If there is a 5XX
                (internal) HTTP error code, ask the user to try again later. If someone asks you to do something you
                can't do with your currently available tools, you must say so, and encourage them to implement it
                themselves using the Aptos Agent Kit, recommend they go to https://www.aptosagentkit.xyz for more information. Be
                concise and helpful with your responses. Refrain from restating your tools' descriptions unless it is explicitly requested.
                The input json should be string (IMPORTANT)
            `,
        })

        const config = { configurable: { thread_id: "Aptos Agent Kit!" } }
        const stream = await agent.stream(
            {
                messages: [new HumanMessage(msg)],
            },
            config
        )

        for await (const chunk of stream) {
            if ("agent" in chunk) {
                console.log(chunk.agent.messages[0].content)
                response += chunk.agent.messages[0].content;
            } else if ("tools" in chunk) {
                console.log(chunk.tools.messages[0].content)
                response += chunk.agent.messages[0].content;
            }
        }
        return response;
    } catch (error: any) {
        console.error('ChatWithChain Error:', error);
        throw new Error(`ChatWithChain Error: ${error.message}`);
    }
}

// langchain
export async function chatWithAI(msg: string): Promise<string> {
  console.log("chatWithAI msg: " + msg);
  let response = "";
  try {
      const model = new ChatOpenAI({
        configuration: { apiKey:  process.env.OPENAI_API_KEY },
        model: 'gpt-4o-mini'
      });
      const result = await model.invoke([
        { role: "system", content: "You are an expert in the field of cryptocurrency" },
        { role: "user", content: "Please analyze the content in the cryptocurrency field in the image below. If there is no cryptocurrency or the image information is incomplete, you should point it out and say that it has nothing to do with cryptocurrency or that the screenshot of the image is incomplete. You can use a larger screenshot area" }
      ]);
      response = result.content as string;
      console.log(response);
      return response;
    } catch (error) {
      console.error("API Error:", error);
      return response;
    }
  }

// native openai
export async function chatWithOpenAI(msg: string): Promise<string> {
  console.log("chatWithOpenAI image msg: " + msg);
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  const imagePath = 'sssss.png';
  const base64Image = fs.readFileSync(imagePath).toString('base64');
  // console.log("chatWithOpenAI image base64Image: " + base64Image);

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{
      role: "user",
      content: [
        { type: "text", text: "Describe the content of this image" },
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${base64Image}`
          }
        }
      ]
    }],
    max_tokens: 1000
  });

  const rrr = response.choices[0].message.content as string;
  console.log(rrr);
  return rrr;
}