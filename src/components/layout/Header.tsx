import { CodeXml } from 'lucide-react';

export function Header() {
  return (
    <header className="py-4 px-6 border-b border-border shadow-md">
      <div className="container mx-auto flex items-center">
        <CodeXml className="h-8 w-8 text-primary mr-2" />
        <h1 className="text-2xl font-headline font-bold text-primary">CodeVision C++</h1>
      </div>
    </header>
  );
}
