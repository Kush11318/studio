
"use client";

import { BotMessageSquare, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from '@/components/ui/skeleton';

interface AiExplanationProps {
  explanation: string;
  isLoading: boolean;
}

export function AiExplanation({ explanation, isLoading }: AiExplanationProps) {
  return (
    <Card className="h-full flex flex-col shadow-md rounded-md">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
        <div className="flex items-center">
          <BotMessageSquare className="h-5 w-5 mr-2 text-primary" />
          <CardTitle className="text-lg font-headline">AI Code Explanation</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-grow overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 text-sm font-code whitespace-pre-wrap break-words">
            {isLoading && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-5/6 mt-4" />
                <Skeleton className="h-4 w-full" />
              </div>
            )}
            {!isLoading && !explanation && <span className="text-muted-foreground">Click "Explain Code" to see an AI-generated explanation here.</span>}
            {!isLoading && explanation && <div dangerouslySetInnerHTML={{ __html: explanation.replace(/\n/g, '<br />') }} />}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
