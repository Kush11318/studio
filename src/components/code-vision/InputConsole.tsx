
"use client";

import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Keyboard } from "lucide-react";

interface InputConsoleProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function InputConsole({ value, onChange, disabled }: InputConsoleProps) {
  return (
    <Card className="h-full flex flex-col shadow-md rounded-md">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
        <div className="flex items-center">
          <Keyboard className="h-5 w-5 mr-2 text-primary" />
          <CardTitle className="text-lg font-headline">Standard Input (stdin)</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-grow">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter input for your C++ program here, if any..."
          className="h-full w-full resize-none border-0 rounded-none focus-visible:ring-0 font-code p-4 text-sm"
          disabled={disabled}
          aria-label="Standard Input for C++ program"
        />
      </CardContent>
    </Card>
  );
}
