
import { CodeXml, Play, FileText, Wand2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onRunCode: () => void;
  onExplainCode: () => void;
  onGenerateCode: () => void;
  isRunDisabled?: boolean;
  isExplainDisabled?: boolean;
  isGenerateDisabled?: boolean;
  isLoadingRun?: boolean;
  isLoadingExplain?: boolean;
  isLoadingGenerate?: boolean;
}

export function Header({
  onRunCode,
  onExplainCode,
  onGenerateCode,
  isRunDisabled = false,
  isExplainDisabled = false,
  isGenerateDisabled = false,
  isLoadingRun = false,
  isLoadingExplain = false,
  isLoadingGenerate = false,
}: HeaderProps) {
  return (
    <header className="py-3 px-4 md:px-6 border-b border-border shadow-md bg-card">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <CodeXml className="h-7 w-7 md:h-8 md:w-8 text-primary mr-2" />
          <h1 className="text-xl md:text-2xl font-headline font-bold text-primary">CodeVision C++</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={onGenerateCode} disabled={isGenerateDisabled} variant="outline" size="sm">
            {isLoadingGenerate ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Wand2 />
            )}
            <span className="ml-2 hidden sm:inline">Generate Code</span>
          </Button>
          <Button onClick={onExplainCode} disabled={isExplainDisabled} variant="outline" size="sm">
            {isLoadingExplain ? (
              <Loader2 className="animate-spin" />
            ) : (
              <FileText />
            )}
            <span className="ml-2 hidden sm:inline">Explain Code</span>
          </Button>
          <Button onClick={onRunCode} disabled={isRunDisabled} size="sm">
            {isLoadingRun ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Play />
            )}
            <span className="ml-2 hidden sm:inline">Run Code</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
