import React from 'react'
// import { Message } from "ai"
import { Message } from "@ai-sdk/react"

const Bubble: React.FC<{message: Message}> = ({ message }) => {
  const { content, role } = message
  return (
    <div className={`${role} bubble`}>
      {content}
    </div>
  )
}

export default Bubble