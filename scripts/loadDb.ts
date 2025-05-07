import { DataAPIClient } from '@datastax/astra-db-ts'
import { PuppeteerWebBaseLoader } from '@langchain/community/document_loaders/web/puppeteer'
import OpenAI from 'openai' 

import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'

import "dotenv/config" 
import { create } from 'domain'

type SimilarityMetric = 'dot_product' | 'cosine' | 'euclidean'

const { ASTRA_DB_NAMESPACE, ASTRA_DB_COLLECTION, ASTRA_DB_API_ENDPOINT, ASTRA_DB_APPLICATION_TOKEN, OPENAI_API_KEY } = process.env

const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

const golfData = [
  'https://en.wikipedia.org/wiki/PGA_Tour',
  'https://en.wikipedia.org/wiki/European_Tour',
  'https://en.wikipedia.org/wiki/LIV_Golf',
  'https://www.pgatour.com/players',
  'https://www.pgatour.com/stats',
  'https://www.pgatour.com/schedule',
]

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
if (!ASTRA_DB_API_ENDPOINT || !ASTRA_DB_NAMESPACE || !ASTRA_DB_COLLECTION) {
  throw new Error("Environment variables ASTRA_DB_API_ENDPOINT and ASTRA_DB_NAMESPACE must be defined.");
}

const db  = client.db(ASTRA_DB_API_ENDPOINT, {keyspace: ASTRA_DB_NAMESPACE}) 

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 100,
})


const createCollection = async (similarityMetric: SimilarityMetric = "dot_product") => {
  const collections = await db.listCollections();
  const collectionExists = collections.some((col) => col.name === ASTRA_DB_COLLECTION);

  if (!collectionExists) {
    const res = await db.createCollection(ASTRA_DB_COLLECTION, {
      vector: {
        dimension: 1536,
        metric: similarityMetric,
      },
    });
    console.log(res);
  } else {
    console.log(`Collection "${ASTRA_DB_COLLECTION}" already exists.`);
  }
};

const loadSampleData = async () => {
  const collection = await db.collection(ASTRA_DB_COLLECTION)
  for await ( const url of golfData) {
    const content = await scrapePage(url)
    const chunks = await splitter.splitText(content)
    for await (const chunk of chunks) {
      const embedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: chunk,
        encoding_format: 'float',
      })

      const vector = embedding.data[0].embedding

      const res = await collection.insertOne({
        $vector: vector,
        text: chunk,
      })
      console.log(res)
    }
  }
}

const scrapePage = async (url: string) => {
  const loader = new PuppeteerWebBaseLoader(url, {
    launchOptions: {
      headless: 'new', // safer than true for WSL+Chromium
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
    gotoOptions: {
      waitUntil: 'domcontentloaded',
    },
    evaluate: async (page, browser) => {
    const result = await page.evaluate(() => document.body.innerHTML)
    await browser.close()
    return result
    }

  })
  return ( await loader.scrape())?.replace(/<[^>]*>?/gm, '') 
}

createCollection().then(() => loadSampleData())