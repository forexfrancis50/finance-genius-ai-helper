import { useState } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { ModelTemplates } from "@/components/ModelTemplates";
import { FileUpload } from "@/components/FileUpload";
import { useToast } from "@/components/ui/use-toast";
import * as XLSX from "xlsx";

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

  const generateSpreadsheet = (template: string) => {
    if (financialData.length === 0) {
      toast({
        variant: "destructive",
        title: "No Data Available",
        description: "Please upload financial data before generating a model.",
      });
      return;
    }

    try {
      // Create a new workbook
      const wb = XLSX.utils.book_new();

      // Add the raw data sheet
      const wsRawData = XLSX.utils.json_to_sheet(financialData);
      XLSX.utils.book_append_sheet(wb, wsRawData, "Raw Data");

      // Create model-specific sheets based on template
      switch (template) {
        case "DCF Analysis":
          // Create DCF worksheet
          const dcfData = [
            ["DCF Analysis"],
            ["Assumptions"],
            ["Growth Rate", "10%"],
            ["Discount Rate", "8%"],
            [],
            ["Projected Cash Flows"],
            ["Year", "Cash Flow", "Present Value"],
          ];
          const wsDCF = XLSX.utils.aoa_to_sheet(dcfData);
          XLSX.utils.book_append_sheet(wb, wsDCF, "DCF Model");
          break;

        case "LBO Model":
          // Create LBO worksheet
          const lboData = [
            ["LBO Analysis"],
            ["Purchase Price", "Enterprise Value"],
            ["Debt", "Equity"],
            [],
            ["Capital Structure"],
            ["Source", "Amount", "Percentage"],
          ];
          const wsLBO = XLSX.utils.aoa_to_sheet(lboData);
          XLSX.utils.book_append_sheet(wb, wsLBO, "LBO Model");
          break;

        case "Sensitivity Analysis":
          // Create Sensitivity worksheet
          const sensitivityData = [
            ["Sensitivity Analysis"],
            ["Variable 1", "Variable 2", "Output"],
            [],
            ["Sensitivity Matrix"],
          ];
          const wsSensitivity = XLSX.utils.aoa_to_sheet(sensitivityData);
          XLSX.utils.book_append_sheet(wb, wsSensitivity, "Sensitivity Analysis");
          break;

        default:
          const wsTemplate = XLSX.utils.json_to_sheet([{ Note: "Template not implemented yet" }]);
          XLSX.utils.book_append_sheet(wb, wsTemplate, template);
      }

      // Save the workbook
      XLSX.writeFile(wb, `${template.toLowerCase().replace(/\s+/g, '_')}_model.xlsx`);

      toast({
        title: "Success",
        description: `${template} model has been generated and downloaded.`,
      });

      // Add AI message about the generated model
      setMessages(prev => [...prev, {
        text: `I've generated a ${template} model based on your data. The spreadsheet has been downloaded to your computer. Would you like me to explain how to use it?`,
        isAi: true
      }]);

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate the model. Please try again.",
      });
    }
  };

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
    generateSpreadsheet(template);
    handleSendMessage(`Can you help me understand the ${template} model you just generated?`);
  };

  const handleDataProcessed = (data: any[]) => {
    setFinancialData(data);
    console.log("Processed financial data:", data);
    
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