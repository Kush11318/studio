
"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Header } from "@/components/layout/Header";
import { OutputConsole } from "@/components/code-vision/OutputConsole";
import { InputConsole } from "@/components/code-vision/InputConsole";
import { AiCodeGenerator } from "@/components/code-vision/AiCodeGenerator";
import { AiExplanation } from "@/components/code-vision/AiExplanation";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Code2 } from "lucide-react";
import { explainCode, type ExplainCodeInput } from "@/ai/flows/explain-code-flow";
import { generateCodeSnippet, type GenerateCodeSnippetInput } from "@/ai/flows/generate-code-snippet";


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
  const [output, setOutput] = useState<string>(""); // For execution output
  const [explanation, setExplanation] = useState<string>(""); // For AI explanation
  
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [isGeneratingAiCode, setIsGeneratingAiCode] = useState<boolean>(false);
  const [isExplainingCode, setIsExplainingCode] = useState<boolean>(false);
  
  const [showGenerateCodeDialog, setShowGenerateCodeDialog] = useState<boolean>(false);
  
  const { toast } = useToast();
  
  const handleEditorChange = useCallback((value: string | undefined) => {
    setCode(value || "");
  }, []);

  const handleRunCode = async () => {
    if (!code.trim()) {
      toast({
        variant: "destructive",
        title: "Empty Code",
        description: "Cannot run empty code. Please write some C++ code.",
      });
      return;
    }
    setIsExecuting(true);
    setExplanation(""); // Clear previous explanation
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
            toast({ 
                title: "Execution Finished with Messages",
                description: "Code executed. Check Errors/Stderr for additional messages.",
            });
        } else {
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
        description: "Could not connect to the execution service.",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleExplainCode = async () => {
    if (!code.trim()) {
      toast({
        variant: "destructive",
        title: "Empty Code",
        description: "Cannot explain empty code. Please write or generate some C++ code.",
      });
      return;
    }
    setIsExplainingCode(true);
    setOutput(""); // Clear previous execution output
    setExplanation("AI is analyzing your code...");
    try {
      const input: ExplainCodeInput = { code };
      const result = await explainCode(input);
      if (result && result.explanation) {
        setExplanation(result.explanation);
        toast({
          title: "Code Explained",
          description: "AI has provided an explanation for your code.",
        });
      } else {
        setExplanation("Failed to get explanation from AI.");
        toast({
          variant: "destructive",
          title: "Explanation Error",
          description: "AI did not return an explanation.",
        });
      }
    } catch (error) {
      console.error("AI Code Explanation Error:", error);
      setExplanation("An error occurred while generating the explanation.");
      toast({
        variant: "destructive",
        title: "Explanation Error",
        description: "An error occurred while explaining the code. Please try again.",
      });
    } finally {
      setIsExplainingCode(false);
    }
  };

  const handleGenerateCodeRequest = () => {
    setShowGenerateCodeDialog(true);
  };

  const handleCodeGeneratedByAI = (generatedCode: string) => {
    setCode(generatedCode);
    setUserInput(""); 
    setExplanation(""); 
    setOutput("");
    setShowGenerateCodeDialog(false); 
  };

  const handleClearConsoleOutput = () => {
    setOutput("");
  };
  
  const anyOperationInProgress = isExecuting || isGeneratingAiCode || isExplainingCode;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header 
        onRunCode={handleRunCode}
        onExplainCode={handleExplainCode}
        onGenerateCode={handleGenerateCodeRequest}
        isRunDisabled={anyOperationInProgress || !code.trim()}
        isExplainDisabled={anyOperationInProgress || !code.trim()}
        isGenerateDisabled={anyOperationInProgress}
        isLoadingRun={isExecuting}
        isLoadingExplain={isExplainingCode}
        isLoadingGenerate={isGeneratingAiCode}
      />
      <main className="flex-grow p-2 md:p-4 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full max-h-[calc(100vh-80px)] rounded-lg border shadow-lg">
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="flex flex-col h-full p-1 md:p-2">
              <Card className="flex-grow flex flex-col overflow-hidden shadow-md rounded-md h-full">
                <CardHeader className="flex flex-row items-center justify-between py-2 px-4 border-b">
                  <div className="flex items-center">
                    <Code2 className="h-5 w-5 mr-2 text-primary" />
                    <CardTitle className="text-lg font-headline">C++ Editor</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-grow overflow-hidden h-full">
                  <CodeEditor value={code} onChange={handleEditorChange} language="cpp" />
                </CardContent>
              </Card>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="flex flex-col h-full p-1 md:p-2 space-y-2 md:space-y-3">
              <div className="flex-shrink-0" style={{ height: '35%'}}>
                <InputConsole 
                  value={userInput} 
                  onChange={setUserInput} 
                  disabled={anyOperationInProgress} 
                />
              </div>
              <div className="flex-grow" style={{ height: '65%'}}>
                { (isExplainingCode || explanation) ? (
                    <AiExplanation explanation={explanation} isLoading={isExplainingCode} />
                  ) : (
                    <OutputConsole output={output} onClear={handleClearConsoleOutput} isExecuting={isExecuting} />
                  )
                }
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>

      <Dialog open={showGenerateCodeDialog} onOpenChange={setShowGenerateCodeDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              AI Code Snippet Generator
            </DialogTitle>
            <DialogDescription>
              Describe the C++ code snippet you need, and the AI will generate it for you.
            </DialogDescription>
          </DialogHeader>
          <AiCodeGenerator 
            onCodeGenerated={handleCodeGeneratedByAI}
            isGenerating={isGeneratingAiCode}
            setIsGenerating={setIsGeneratingAiCode}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

    