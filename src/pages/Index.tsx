import { useState } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { ModelTemplates } from "@/components/ModelTemplates";
import { FileUpload } from "@/components/FileUpload";
import { useToast } from "@/components/ui/use-toast";

interface Message {
  text: string;
  isAi: boolean;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hello! I'm your financial modeling assistant. I can help you with DCF analysis, LBO models, sensitivity analysis, and more. What would you like to work on?",
      isAi: true,
    },
  ]);
  const [financialData, setFinancialData] = useState<any[]>([]);
  const { toast } = useToast();

  const handleSendMessage = (message: string) => {
    setMessages((prev) => [...prev, { text: message, isAi: false }]);

    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          text: "I understand you want to work on financial modeling. Could you provide more details about your specific requirements or which type of analysis you'd like to perform?",
          isAi: true,
        },
      ]);
    }, 1000);
  };

  const handleTemplateSelect = (template: string) => {
    handleSendMessage(`Can you help me create a ${template}?`);
  };

  const handleDataProcessed = (data: any[]) => {
    setFinancialData(data);
    console.log("Processed financial data:", data);
    
    // Add a message to inform the user about the processed data
    setMessages(prev => [...prev, {
      text: `I've processed your financial data with ${data.length} rows. What type of analysis would you like to perform with this data?`,
      isAi: true
    }]);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-white p-4">
        <div className="container">
          <h1 className="text-2xl font-bold">Financial Modeling AI</h1>
          <p className="text-sm opacity-90">Your intelligent financial modeling assistant</p>
        </div>
      </header>

      <main className="container flex-1 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <ModelTemplates onSelectTemplate={handleTemplateSelect} />
          <FileUpload onDataProcessed={handleDataProcessed} />
        </div>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-4xl mx-auto">
          <div className="h-[600px] overflow-y-auto p-4">
            {messages.map((message, index) => (
              <ChatMessage
                key={index}
                message={message.text}
                isAi={message.isAi}
              />
            ))}
          </div>
          
          <ChatInput onSendMessage={handleSendMessage} />
        </div>
      </main>

      <footer className="bg-primary text-white py-4 mt-auto">
        <div className="container text-center text-sm">
          <p>© 2024 Financial Modeling AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;