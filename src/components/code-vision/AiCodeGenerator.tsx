
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { generateCodeSnippet, type GenerateCodeSnippetInput } from "@/ai/flows/generate-code-snippet";

const formSchema = z.object({
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }).max(500, {
    message: "Description must be at most 500 characters."
  }),
});

interface AiCodeGeneratorProps {
  onCodeGenerated: (code: string) => void;
  isGenerating: boolean;
  setIsGenerating: (isGenerating: boolean) => void;
}

export function AiCodeGenerator({ onCodeGenerated, isGenerating, setIsGenerating }: AiCodeGeneratorProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsGenerating(true);
    try {
      const input: GenerateCodeSnippetInput = { description: values.description };
      const result = await generateCodeSnippet(input);
      if (result && result.codeSnippet) {
        onCodeGenerated(result.codeSnippet);
        toast({
          title: "Code Generated",
          description: "AI has generated a C++ code snippet.",
        });
        form.reset();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to generate code. AI did not return a snippet.",
        });
      }
    } catch (error) {
      console.error("AI Code Generation Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while generating code. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="py-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Describe the C++ code snippet you need:</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., A function that sorts an array of integers using bubble sort, including comments."
                    className="resize-none font-code min-h-[100px]"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isGenerating} className="w-full bg-primary hover:bg-primary/90">
            {isGenerating ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Wand2 />
            )}
            <span className="ml-2">Generate Code</span>
          </Button>
        </form>
      </Form>
    </div>
  );
}
