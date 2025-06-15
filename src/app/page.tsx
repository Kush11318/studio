"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Header } from "@/components/layout/Header";
import { OutputConsole } from "@/components/code-vision/OutputConsole";
import { AiCodeGenerator } from "@/components/code-vision/AiCodeGenerator";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Play, Loader2, FileCode, Code2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const CodeEditor = dynamic(() => import("@/components/code-vision/CodeEditor"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full p-4 bg-card rounded-md">
      <Skeleton className="h-8 w-1/3 mb-4" />
      <Skeleton className="h-full w-full" />
    </div>
  ),
});

const initialCppCode = `#include <iostream>
#include <vector>
#include <string>

// Function to greet the user
void greet(const std::string& name) {
    std::cout << "Hello, " << name << " from CodeVision C++!" << std::endl;
}

int main() {
    greet("Developer");

    // Example of using a vector
    std::vector<int> numbers = {1, 2, 3, 4, 5};
    std::cout << "Numbers in vector: ";
    for (int num : numbers) {
        std::cout << num << " ";
    }
    std::cout << std::endl;

    std::cout << "Enter a short description above and click 'Generate Code' to see AI in action!" << std::endl;

    return 0;
}
`;

export default function HomePage() {
  const [code, setCode] = useState<string>(initialCppCode);
  const [output, setOutput] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [isGeneratingAiCode, setIsGeneratingAiCode] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Debounce editor changes
  const handleEditorChange = useCallback((value: string | undefined) => {
    setCode(value || "");
  }, []);

  const handleRunCode = async () => {
    setIsExecuting(true);
    setOutput(""); // Clear previous output
    // Simulate code execution
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock output based on current code for demonstration
    let mockOutput = "Executing code...\n";
    if (code.includes("std::cout")) {
      if (code.includes("Hello, CodeVision C++!")) {
        mockOutput += "Hello, Developer from CodeVision C++!\nNumbers in vector: 1 2 3 4 5 \nEnter a short description above and click 'Generate Code' to see AI in action!\n";
      } else if (code.includes("Hello")) {
         mockOutput += code.match(/std::cout << "(.*?)"/)?.[1] + "\n" || "Sample Output\n";
      } else {
        mockOutput += "Code executed. (Mocked output)\n";
      }
    } else {
      mockOutput += "No output statements found (std::cout). (Mocked output)\n";
    }
    mockOutput += "Execution finished.";

    setOutput(mockOutput);
    setIsExecuting(false);
    toast({
      title: "Code Execution",
      description: "Code execution finished (simulated).",
    });
  };

  const handleClearConsole = () => {
    setOutput("");
  };

  const handleCodeGenerated = (generatedCode: string) => {
    setCode(generatedCode);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <main className="flex-grow p-4 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full max-h-[calc(100vh-100px)] rounded-lg border shadow-xl">
          <ResizablePanel defaultSize={60} minSize={30}>
            <div className="flex flex-col h-full p-1 md:p-2 space-y-2 md:space-y-4">
              <AiCodeGenerator 
                onCodeGenerated={handleCodeGenerated}
                isGenerating={isGeneratingAiCode}
                setIsGenerating={setIsGeneratingAiCode}
              />
              <Card className="flex-grow flex flex-col overflow-hidden shadow-md rounded-md">
                <CardHeader className="flex flex-row items-center justify-between py-2 px-4 border-b">
                  <div className="flex items-center">
                    <Code2 className="h-5 w-5 mr-2 text-primary" />
                    <CardTitle className="text-lg font-headline">C++ Editor</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-grow overflow-hidden">
                  <CodeEditor value={code} onChange={handleEditorChange} language="cpp" />
                </CardContent>
              </Card>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={40} minSize={20}>
            <div className="flex flex-col h-full p-1 md:p-2 space-y-2 md:space-y-4">
              <Button onClick={handleRunCode} disabled={isExecuting || isGeneratingAiCode} className="w-full font-medium shadow-md">
                {isExecuting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Run Code
              </Button>
              <div className="flex-grow overflow-hidden">
                <OutputConsole output={output} onClear={handleClearConsole} isExecuting={isExecuting} />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
}
