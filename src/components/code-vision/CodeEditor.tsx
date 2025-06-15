"use client";

import Editor, { OnChange, OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface CodeEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language?: string;
  className?: string;
  readOnly?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  value, 
  onChange, 
  language = "cpp", 
  className,
  readOnly = false 
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount: OnMount = (editorInstance, monaco) => {
    editorRef.current = editorInstance;
    // Configure C++ specific options if necessary
    // monaco.languages.cpp.cppDefaults.setDiagnosticsOptions({ ... });
  };

  return (
    <div className={cn("h-full w-full bg-card rounded-md overflow-hidden", className)}>
      <Editor
        height="100%"
        language={language}
        theme="vs-dark" 
        value={value}
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "Source Code Pro, monospace",
          wordWrap: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          readOnly: readOnly,
          padding: { top: 10, bottom: 10},
          renderLineHighlight: "gutter",
          scrollbar: {
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          }
        }}
        loading={<Skeleton className="h-full w-full" />}
      />
    </div>
  );
};

export default CodeEditor;
