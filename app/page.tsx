"use client"

import Image from "next/image"
import golfGPTLogo from "./assets/golfgpt-logo.jpg"
import { useChat, Message } from "@ai-sdk/react"
// import { Message } from "ai"
import Bubble from "./components/Bubble"
import PromtSuggestionRow from "./components/PromptSuggestionRow"
import LoadingBubble from "./components/LoadingBubble"

const Home = () => {
  const { append, status, input, messages, handleInputChange, handleSubmit } = useChat()

  const isLoading = status === 'streaming';

  const noMessages = !messages || messages.length === 0

  const handlePromptClick = (promptText: string) => {
    const msg: Omit<Message, "id"> = {
      // id: crypto.randomUUID(),
      content: promptText,
      role: "user",
    }
    append(msg)
  }

  console.log('Page Messages:', messages);

  return (
    <main>
      <Image src={golfGPTLogo} alt="Golf GPT" width="250"  />
      <section className={noMessages ? "" : "populated"}> 
        {noMessages ? (
          <>
            <p className="starter-text">
              Welcome to GolfGPT! Ask me anything about the PGA Tour.
            </p>
            <br />
            {<PromtSuggestionRow onPromptClick={handlePromptClick}/>}
          </>
        ) : (
          <>
            {messages.map((message: Message, index) => (
              <Bubble key={index} message={message} />
            ))}
            {isLoading && <LoadingBubble />}
          </>
        )}
      </section>
        <form onSubmit={handleSubmit}>
          <input className="question-box" onChange={handleInputChange} value={input} placeholder="Ask me anything about the PGA..." />
          <input type="submit" />
        </form>
    </main>
  )
}

export default Home