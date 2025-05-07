import PromptSuggestionButton from "./PromptSuggestionButton"

interface PromtSuggestionRowProps {
  onPromptClick: (prompt: string) => void; // Explicitly type the onPromptClick prop
}

const PromtSuggestionRow: React.FC<PromtSuggestionRowProps> = ({ onPromptClick }) => {
  const prompts = [
    "Who is leading the FedEx points?",
    "Can you provide me with the current leaderboard standings?",
    "What are the upcoming tournaments in the PGA Tour schedule?",
    "Can you give me a summary of the last tournament results?",
  ]
  return (
    <div className="prompt-suggestion-row"> 
      {prompts.map((prompt, index) => 
        <PromptSuggestionButton 
          key={`suggestion-${index}`} 
          text={prompt} 
          onClick={() => onPromptClick(prompt)}
        />)}
    </div>
  )
}

export default PromtSuggestionRow