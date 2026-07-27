"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SendIcon } from "lucide-react";

import { createTicketSchema, type CreateTicketInput } from "@/lib/validations/ticket-schema";
import { useCreateTicket } from "@/lib/query/useCreateTicket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { DepartmentCategorySelect } from "@/components/create-ticket/DepartmentCategorySelect";
import { PrioritySelector } from "@/components/create-ticket/PrioritySelector";
import { TagInput } from "@/components/create-ticket/TagInput";
import { FileUploadDropzone } from "@/components/create-ticket/FileUploadDropzone";
import { CategorySuggestionBanner } from "@/components/create-ticket/CategorySuggestionBanner";
import { DuplicateTicketBanner } from "@/components/create-ticket/DuplicateTicketBanner";
import { AiSolutionPanel } from "@/components/create-ticket/AiSolutionPanel";

const DEFAULT_VALUES: CreateTicketInput = {
  subject: "",
  description: "",
  categoryId: "",
  departmentId: "",
  priority: "medium",
  tags: [],
  attachments: [],
};

export function CreateTicketForm() {
  const router = useRouter();
  const createTicket = useCreateTicket();

  const form = useForm<CreateTicketInput>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onBlur",
  });

  const subject = form.watch("subject");
  const description = form.watch("description");
  const categoryId = form.watch("categoryId");

  function onSubmit(values: CreateTicketInput) {
    createTicket.mutate(values, {
      onSuccess: (ticket) => {
        router.push(`/tickets/${ticket.id}`);
      },
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Briefly summarize the issue" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What's happening? Include steps to reproduce if relevant."
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DuplicateTicketBanner subject={subject} description={description} />
              <CategorySuggestionBanner
                description={description}
                currentCategoryId={categoryId}
                onApply={(id) => form.setValue("categoryId", id, { shouldValidate: true })}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={() => (
                  <FormItem>
                    <DepartmentCategorySelect
                      categoryId={form.watch("categoryId")}
                      departmentId={form.watch("departmentId")}
                      onCategoryChange={(id) =>
                        form.setValue("categoryId", id, { shouldValidate: true })
                      }
                      onDepartmentChange={(id) =>
                        form.setValue("departmentId", id, { shouldValidate: true })
                      }
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <FormControl>
                      <PrioritySelector value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <TagInput value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="attachments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Attachments</FormLabel>
                    <FormControl>
                      <FileUploadDropzone value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={createTicket.isPending} className="w-full sm:w-auto">
                <SendIcon /> {createTicket.isPending ? "Submitting..." : "Submit ticket"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <AiSolutionPanel categoryId={categoryId || undefined} />
      </div>
    </div>
  );
}
