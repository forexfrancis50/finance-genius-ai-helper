import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: string;
  isAi: boolean;
}

export const ChatMessage = ({ message, isAi }: ChatMessageProps) => {
  return (
    <div
      className={cn(
        "p-4 rounded-lg mb-4 animate-fade-in",
        isAi
          ? "bg-secondary text-primary ml-4"
          : "bg-primary text-white mr-4"
      )}
    >
      <div className="flex items-start">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center mr-3",
            isAi ? "bg-primary text-white" : "bg-accent text-primary"
          )}
        >
          {isAi ? "AI" : "U"}
        </div>
        <p className="text-sm leading-relaxed">{message}</p>
      </div>
    </div>
  );
};