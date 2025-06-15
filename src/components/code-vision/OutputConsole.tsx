"use client";

import { Terminal, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface OutputConsoleProps {
  output: string;
  onClear: () => void;
  isExecuting?: boolean;
}

export function OutputConsole({ output, onClear, isExecuting }: OutputConsoleProps) {
  return (
    <Card className="h-full flex flex-col shadow-lg rounded-md">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
        <div className="flex items-center">
          <Terminal className="h-5 w-5 mr-2 text-primary" />
          <CardTitle className="text-lg font-headline">Output Console</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={onClear} aria-label="Clear console">
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0 flex-grow">
        <ScrollArea className="h-full">
          <pre className="p-4 text-sm font-code whitespace-pre-wrap break-all">
            {isExecuting && !output && <span className="text-muted-foreground">Executing code...</span>}
            {output || <span className="text-muted-foreground">Code output will appear here.</span>}
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
