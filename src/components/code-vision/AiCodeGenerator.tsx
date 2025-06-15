"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateCodeSnippet, type GenerateCodeSnippetInput } from "@/ai/flows/generate-code-snippet";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
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
    <Card className="mb-4 shadow-lg rounded-md">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-lg font-headline flex items-center">
          <Wand2 className="h-5 w-5 mr-2 text-primary" />
          AI Code Snippet Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Describe the C++ code snippet you need:</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., A function that sorts an array of integers using bubble sort."
                      className="resize-none font-code"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isGenerating} className="w-full bg-accent hover:bg-accent/90">
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Generate Code
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
