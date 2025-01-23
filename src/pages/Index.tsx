import { useState } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { ModelTemplates } from "@/components/ModelTemplates";
import { FileUpload } from "@/components/FileUpload";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { generateAIResponse } from "@/utils/ai";
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
  const [apiKey, setApiKey] = useState("");
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const { toast } = useToast();

  const handleApiKeySubmit = () => {
    if (apiKey.trim()) {
      setIsApiKeySet(true);
      localStorage.setItem('lm_studio_api_key', apiKey);
      toast({
        title: "API Key Saved",
        description: "Your LM Studio API key has been saved securely in local storage.",
      });
    }
  };

  const handleSendMessage = async (message: string) => {
    try {
      setMessages((prev) => [...prev, { text: message, isAi: false }]);
      
      const storedApiKey = localStorage.getItem('lm_studio_api_key') || apiKey;
      if (!storedApiKey) {
        toast({
          variant: "destructive",
          title: "API Key Required",
          description: "Please enter your LM Studio API key to use the AI features.",
        });
        return;
      }

      const aiResponse = await generateAIResponse(message, storedApiKey);
      setMessages((prev) => [...prev, { text: aiResponse, isAi: true }]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate AI response. Please ensure LM Studio is running and try again.",
      });
    }
  };

  const calculateDCF = (data: any[]) => {
    // Find revenue and growth data from historical financials
    const revenues = data
      .filter(row => row.revenue || row.sales)
      .map(row => row.revenue || row.sales);
    
    const historicalGrowth = revenues.length > 1 
      ? ((revenues[revenues.length - 1] / revenues[0]) ** (1 / (revenues.length - 1)) - 1)
      : 0.1; // Default to 10% if not enough data

    // Calculate EBIT margin from the most recent year
    const latestEBIT = data.find(row => row.ebit || row.operating_income)?.ebit || 
                      data.find(row => row.ebit || row.operating_income)?.operating_income || 
                      revenues[revenues.length - 1] * 0.15; // Assume 15% margin if no EBIT data

    const ebitMargin = latestEBIT / revenues[revenues.length - 1];
    
    // Project future cash flows
    const projectionYears = 5;
    const wacc = 0.1; // 10% discount rate
    const terminalGrowth = 0.02; // 2% terminal growth

    const projectedCashFlows = Array(projectionYears).fill(0).map((_, i) => {
      const year = i + 1;
      const revenue = revenues[revenues.length - 1] * Math.pow(1 + historicalGrowth, year);
      const ebit = revenue * ebitMargin;
      const freeCashFlow = ebit * (1 - 0.25); // Assume 25% tax rate
      const presentValue = freeCashFlow / Math.pow(1 + wacc, year);
      return { year, revenue, ebit, freeCashFlow, presentValue };
    });

    // Calculate terminal value
    const terminalValue = (projectedCashFlows[projectionYears - 1].freeCashFlow * (1 + terminalGrowth)) / 
                         (wacc - terminalGrowth);
    const presentTerminalValue = terminalValue / Math.pow(1 + wacc, projectionYears);

    return {
      historicalData: { revenues, historicalGrowth, ebitMargin },
      projectedCashFlows,
      terminalValue,
      presentTerminalValue,
      enterpriseValue: presentTerminalValue + projectedCashFlows.reduce((sum, cf) => sum + cf.presentValue, 0)
    };
  };

  const calculateLBO = (data: any[]) => {
    // Get latest financial metrics
    const latestRevenue = data.find(row => row.revenue || row.sales)?.revenue || 
                         data.find(row => row.revenue || row.sales)?.sales;
    const latestEBITDA = data.find(row => row.ebitda)?.ebitda || latestRevenue * 0.2; // Assume 20% EBITDA margin

    // LBO assumptions
    const purchaseMultiple = 8;
    const enterpriseValue = latestEBITDA * purchaseMultiple;
    const equityContribution = enterpriseValue * 0.4; // 40% equity
    const debtFinancing = enterpriseValue - equityContribution;
    const interestRate = 0.08; // 8% interest rate

    // Project 5-year returns
    const projectionYears = 5;
    const growthRate = 0.1; // 10% annual growth
    const exitMultiple = 7;

    const projections = Array(projectionYears).fill(0).map((_, i) => {
      const year = i + 1;
      const revenue = latestRevenue * Math.pow(1 + growthRate, year);
      const ebitda = revenue * 0.2;
      const interestExpense = debtFinancing * interestRate;
      const debtPaydown = ebitda * 0.4; // 40% of EBITDA goes to debt paydown
      const remainingDebt = Math.max(0, debtFinancing - (debtPaydown * year));
      
      return { year, revenue, ebitda, interestExpense, debtPaydown, remainingDebt };
    });

    const exitEBITDA = projections[projectionYears - 1].ebitda;
    const exitValue = exitEBITDA * exitMultiple;
    const remainingDebt = projections[projectionYears - 1].remainingDebt;
    const equityValue = exitValue - remainingDebt;
    const irr = ((equityValue / equityContribution) ** (1/projectionYears)) - 1;

    return {
      initialMetrics: { enterpriseValue, equityContribution, debtFinancing },
      projections,
      exitAnalysis: { exitValue, remainingDebt, equityValue, irr }
    };
  };

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
      const wb = XLSX.utils.book_new();

      // Add the raw data sheet
      const wsRawData = XLSX.utils.json_to_sheet(financialData);
      XLSX.utils.book_append_sheet(wb, wsRawData, "Raw Data");

      switch (template) {
        case "DCF Analysis": {
          const dcfResults = calculateDCF(financialData);
          
          const dcfData = [
            ["DCF Analysis"],
            ["Historical Metrics"],
            ["Historical Growth Rate", `${(dcfResults.historicalData.historicalGrowth * 100).toFixed(1)}%`],
            ["EBIT Margin", `${(dcfResults.historicalData.ebitMargin * 100).toFixed(1)}%`],
            [],
            ["Projected Cash Flows"],
            ["Year", "Revenue", "EBIT", "Free Cash Flow", "Present Value"],
            ...dcfResults.projectedCashFlows.map(cf => [
              cf.year,
              cf.revenue.toFixed(0),
              cf.ebit.toFixed(0),
              cf.freeCashFlow.toFixed(0),
              cf.presentValue.toFixed(0)
            ]),
            [],
            ["Terminal Value Analysis"],
            ["Terminal Value", dcfResults.terminalValue.toFixed(0)],
            ["Present Value of Terminal Value", dcfResults.presentTerminalValue.toFixed(0)],
            ["Enterprise Value", dcfResults.enterpriseValue.toFixed(0)]
          ];

          const wsDCF = XLSX.utils.aoa_to_sheet(dcfData);
          XLSX.utils.book_append_sheet(wb, wsDCF, "DCF Model");
          break;
        }

        case "LBO Model": {
          const lboResults = calculateLBO(financialData);
          
          const lboData = [
            ["LBO Analysis"],
            ["Initial Investment"],
            ["Enterprise Value", lboResults.initialMetrics.enterpriseValue.toFixed(0)],
            ["Equity Contribution", lboResults.initialMetrics.equityContribution.toFixed(0)],
            ["Debt Financing", lboResults.initialMetrics.debtFinancing.toFixed(0)],
            [],
            ["Projections"],
            ["Year", "Revenue", "EBITDA", "Interest Expense", "Debt Paydown", "Remaining Debt"],
            ...lboResults.projections.map(p => [
              p.year,
              p.revenue.toFixed(0),
              p.ebitda.toFixed(0),
              p.interestExpense.toFixed(0),
              p.debtPaydown.toFixed(0),
              p.remainingDebt.toFixed(0)
            ]),
            [],
            ["Exit Analysis"],
            ["Exit Enterprise Value", lboResults.exitAnalysis.exitValue.toFixed(0)],
            ["Remaining Debt", lboResults.exitAnalysis.remainingDebt.toFixed(0)],
            ["Equity Value", lboResults.exitAnalysis.equityValue.toFixed(0)],
            ["IRR", `${(lboResults.exitAnalysis.irr * 100).toFixed(1)}%`]
          ];

          const wsLBO = XLSX.utils.aoa_to_sheet(lboData);
          XLSX.utils.book_append_sheet(wb, wsLBO, "LBO Model");
          break;
        }

        case "Sensitivity Analysis": {
          const dcfResults = calculateDCF(financialData);
          const baseEV = dcfResults.enterpriseValue;
          
          // Create sensitivity matrix for growth rate and discount rate
          const growthRates = [-0.02, -0.01, 0, 0.01, 0.02];
          const discountRates = [0.08, 0.09, 0.1, 0.11, 0.12];
          
          const sensitivityMatrix = [
            ["Enterprise Value Sensitivity (in millions)", ...discountRates.map(r => `${(r * 100).toFixed(1)}% WACC`)],
            ...growthRates.map(g => [
              `${(g * 100).toFixed(1)}% Growth`,
              ...discountRates.map(r => {
                const adjustedEV = baseEV * (1 + g) / (1 + r);
                return (adjustedEV / 1000000).toFixed(1);
              })
            ])
          ];

          const wsSensitivity = XLSX.utils.aoa_to_sheet(sensitivityMatrix);
          XLSX.utils.book_append_sheet(wb, wsSensitivity, "Sensitivity Analysis");
          break;
        }

        default:
          const wsTemplate = XLSX.utils.json_to_sheet([{ Note: "Template not implemented yet" }]);
          XLSX.utils.book_append_sheet(wb, wsTemplate, template);
      }

      XLSX.writeFile(wb, `${template.toLowerCase().replace(/\s+/g, '_')}_model.xlsx`);

      toast({
        title: "Success",
        description: `${template} model has been generated and downloaded.`,
      });

      setMessages(prev => [...prev, {
        text: `I've generated a ${template} model based on your data. The spreadsheet has been downloaded to your computer. Would you like me to explain how to use it?`,
        isAi: true
      }]);

    } catch (error) {
      console.error('Error generating spreadsheet:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate the model. Please try again.",
      });
    }
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
        {!isApiKeySet && (
          <div className="mb-6 p-4 bg-secondary rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Enter LM Studio API Key</h2>
            <div className="flex gap-2">
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your LM Studio API key"
                className="flex-1"
              />
              <Button onClick={handleApiKeySubmit}>Save Key</Button>
            </div>
            <p className="text-sm mt-2 text-muted-foreground">
              Make sure LM Studio is running on your machine at http://localhost:1234
            </p>
          </div>
        )}

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
