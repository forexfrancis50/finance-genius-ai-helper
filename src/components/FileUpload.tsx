import { useState } from "react";
import { Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export const FileUpload = ({ onDataProcessed }: { onDataProcessed: (data: any[]) => void }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const processExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Basic data cleaning
        const cleanedData = jsonData.map((row: any) => {
          const cleanRow: any = {};
          Object.keys(row).forEach(key => {
            // Remove special characters from column names
            const cleanKey = key.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
            // Convert numeric strings to numbers
            cleanRow[cleanKey] = isNaN(row[key]) ? row[key] : Number(row[key]);
          });
          return cleanRow;
        });

        onDataProcessed(cleanedData);
        toast({
          title: "Success",
          description: "Financial data processed successfully",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to process file. Please check the format.",
        });
      }
      setIsProcessing(false);
    };

    reader.onerror = () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to read file",
      });
      setIsProcessing(false);
    };

    reader.readAsBinaryString(file);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'xlsx' && fileExtension !== 'csv') {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a CSV or XLSX file",
      });
      return;
    }

    setIsProcessing(true);
    processExcelFile(file);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed rounded-lg border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors">
      <Upload className="w-12 h-12 text-gray-400" />
      <div className="text-center">
        <h3 className="text-lg font-semibold">Upload Financial Data</h3>
        <p className="text-sm text-gray-500">Upload CSV or XLSX files</p>
      </div>
      <Button
        variant="outline"
        className="relative"
        disabled={isProcessing}
      >
        {isProcessing ? "Processing..." : "Choose File"}
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept=".csv,.xlsx"
          onChange={handleFileUpload}
          disabled={isProcessing}
        />
      </Button>
    </div>
  );
};