
"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Header } from "@/components/layout/Header";
import { OutputConsole } from "@/components/code-vision/OutputConsole";
import { InputConsole } from "@/components/code-vision/InputConsole";
import { AiCodeGenerator } from "@/components/code-vision/AiCodeGenerator";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Play, Loader2, Code2 } from "lucide-react";
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

// Main function to demonstrate input and output
int main() {
    std::string name;
    std::cout << "Enter your name: ";
    std::cin >> name;
    std::cout << "Hello, " << name << " from CodeVision C++!" << std::endl;

    // Example of using a vector
    std::vector<int> numbers = {1, 2, 3, 4, 5};
    std::cout << "Numbers in vector: ";
    for (int num : numbers) {
        std::cout << num << " ";
    }
    std::cout << std::endl;

    // Example of reading multiple inputs
    int val1, val2;
    std::cout << "Enter two integers separated by space: ";
    std::cin >> val1 >> val2;
    std::cout << "You entered: " << val1 << " and " << val2 << std::endl;
    std::cout << "Their sum is: " << val1 + val2 << std::endl;

    return 0;
}
`;

export default function HomePage() {
  const [code, setCode] = useState<string>(initialCppCode);
  const [userInput, setUserInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [isGeneratingAiCode, setIsGeneratingAiCode] = useState<boolean>(false);
  const { toast } = useToast();
  
  const handleEditorChange = useCallback((value: string | undefined) => {
    setCode(value || "");
  }, []);

  const handleRunCode = async () => {
    setIsExecuting(true);
    setOutput("Executing code...\n"); 
    try {
      const response = await fetch('/api/run-cpp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, input: userInput }),
      });

      const result = await response.json();

      if (response.ok) {
        let fullOutput = "";
        if (result.output) {
          fullOutput += `Output:\n${result.output}\n\n`;
        }
        if (result.error) {
          fullOutput += `Errors/Stderr:\n${result.error}\n`;
        }
        if (!result.output && !result.error) {
          fullOutput = "Execution finished with no output or errors.";
        }
        setOutput(fullOutput.trim() || "Execution finished. (No textual output)");
        
        if (result.error && (response.status !== 200 || result.error.toLowerCase().includes("error:") || result.error.includes("timed out"))) {
             toast({
                variant: "destructive",
                title: "Execution Problem",
                description: "Code might have compilation errors, runtime issues, or timed out. Check Errors/Stderr.",
            });
        } else if (result.error) {
            toast({ // For warnings or non-critical stderr
                title: "Execution Finished with Messages",
                description: "Code executed. Check Errors/Stderr for additional messages.",
            });
        }
         else {
            toast({
                title: "Code Execution Successful",
                description: "Code execution finished.",
            });
        }
      } else {
        setOutput(`Error: ${result.error || 'Failed to execute code.'}`);
        toast({
          variant: "destructive",
          title: "API Error",
          description: result.error || "An unknown error occurred with the execution service.",
        });
      }
    } catch (error: any) {
      setOutput(`Network or server error: ${error.message}`);
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Could not connect to the execution service. Please ensure Docker is running and accessible.",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleClearConsole = () => {
    setOutput("");
  };

  const handleCodeGenerated = (generatedCode: string) => {
    setCode(generatedCode);
    setUserInput(""); // Clear input when new code is generated
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
              <div className="flex-grow flex flex-col space-y-2 md:space-y-4 overflow-hidden">
                <div className="min-h-[100px] max-h-48"> 
                  <InputConsole 
                    value={userInput} 
                    onChange={setUserInput} 
                    disabled={isExecuting || isGeneratingAiCode} 
                  />
                </div>
                <div className="flex-grow overflow-hidden">
                  <OutputConsole output={output} onClear={handleClearConsole} isExecuting={isExecuting} />
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
}
