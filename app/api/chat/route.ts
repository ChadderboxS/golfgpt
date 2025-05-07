import OpenAi from "openai";
// import { OpenAIStream, StreamingTextResponse } from "ai"; //old version
import { openai as aiOpenai } from '@ai-sdk/openai'
import { streamText } from "ai"; //new version
import { DataAPIClient } from "@datastax/astra-db-ts";

const { ASTRA_DB_NAMESPACE, ASTRA_DB_COLLECTION, ASTRA_DB_API_ENDPOINT, ASTRA_DB_APPLICATION_TOKEN, OPENAI_API_KEY } = process.env

export const runtime = "edge";

const openai = new OpenAi({ apiKey: OPENAI_API_KEY })

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
if (!ASTRA_DB_API_ENDPOINT || !ASTRA_DB_NAMESPACE) {
  throw new Error("Environment variables ASTRA_DB_API_ENDPOINT or ASTRA_DB_NAMESPACE are not defined");
}
const db = client.db(ASTRA_DB_API_ENDPOINT, { keyspace: ASTRA_DB_NAMESPACE });

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const latestMessage = messages[messages.length - 1]?.content

    let docContext = ""
    
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: latestMessage,
      encoding_format: "float"
    })

    try {
      if (!ASTRA_DB_COLLECTION) {
        throw new Error("Environment variable ASTRA_DB_COLLECTION is not defined");
      }
      const collection = await db.collection(ASTRA_DB_COLLECTION);
      const cursor = collection.find({}, {
        sort: {
          $vector: embedding.data[0].embedding,
        },
        limit: 10
      })
      

      const documents = await cursor.toArray()
      
      const docsMap = documents?.map(doc => doc.text)
    
      docContext = JSON.stringify(docsMap)

    } catch (err) {
      console.log("Error querring db:", err);
      docContext = ""
    }

    const template = {
      role: "system",
      content: `You are a helpful assistant that knows everything about the PGA Tour. 
      Use the below context to augment what you know about the PGA Tour.
      The context will proovide you with the most recent page data from wikipedia, the official PGA website and others.
      If the context doesn't include the information you need, answer based on your existing knowledge and don't mention the source of your information or what the context does or doesn't include.
      Format responses using markdown where applicable and don't return images.
      -----------------------
      START CONTEXT 
      ${docContext}
      END CONTEXT
      -----------------------
      QUESTION: ${latestMessage}
      -----------------------
      `
    }

    console.log("Template:", template);
    console.log("Messages:", messages);

    const { textStream } = await streamText({
      model: aiOpenai('gpt-4'),
      prompt: [template, ...messages].map(msg => typeof msg === 'string' ? msg : msg.content).join('\n'),
    });
    
    return new Response(textStream, {
      headers: { 
        'Content-Type': "text/event-stream",
       },
    })

    // const response = await openai.chat.completions.create({
    //   model: "gpt-4",
    //   messages: [template, ...messages],
    //   stream: true,
    // })
    
    // const stream = OpenAIStream(response)
    // return new StreamingTextResponse(stream)
  } catch (error) {
    throw error
  }
}