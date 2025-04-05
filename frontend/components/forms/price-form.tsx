"use client";
import { CourseGetProps } from "@/lib/eventModels";
import React, { useState } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

interface PriceFormProps {
  initialData: CourseGetProps;
  onUpdate: (value: number) => void;
  disabled?: boolean;
}

const formSchema = z.object({
  price: z.number().min(1, { message: "Price must be at least 1" }),
});

const PriceForm = ({ initialData, onUpdate, disabled }: PriceFormProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { price: initialData.price || 0 }, // Default to 0 if null
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsEditing(false);
    form.reset({ price: values.price });
    onUpdate(values.price); // Delegate update to parent
  };

  const toggleEdit = () => setIsEditing((current) => !current);

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4 dark:bg-gray-800 dark:border-gray-700">
      <div className="font-medium flex items-center justify-between">
        Course price
        <Button
          variant={"ghost"}
          onClick={toggleEdit}
          disabled={disabled || isSubmitting}
          className="dark:text-gray-300 dark:hover:bg-gray-700"
        >
          {isEditing ? (
            <>Cancel</>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </>
          )}
        </Button>
      </div>
      {!isEditing && (
        <p className="text-sm mt-2 text-gray-700 dark:text-gray-300">
          {initialData.price !== null ? initialData.price : "Not set"}
        </p>
      )}
      {isEditing && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="number"
                      disabled={isSubmitting || disabled}
                      placeholder="0"
                      className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage className="dark:text-red-400" />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-x-2 justify-end">
              <Button
                disabled={!isValid || isSubmitting || disabled}
                type="submit"
                className="dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
              >
                Save
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};

export default PriceForm;
