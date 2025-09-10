import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEmployeeSchema, type InsertEmployee } from "@shared/schema";
import { storage } from "@/lib/localStorage";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { z } from "zod";

const checkInSchema = z.object({
  name: z.string().min(1, "Name is required"),
  startTime: z.string().min(1, "Start time is required"),
  revenueCenter: z.string().min(1, "Revenue center is required"),
});

type CheckInFormData = z.infer<typeof checkInSchema>;

interface EmployeeCheckInProps {
  onEmployeeAdded?: () => void;
}

export function EmployeeCheckIn({ onEmployeeAdded }: EmployeeCheckInProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<CheckInFormData>({
    resolver: zodResolver(checkInSchema),
    defaultValues: {
      name: "",
      startTime: new Date().toTimeString().slice(0, 5),
      revenueCenter: "",
    },
  });

  const onSubmit = async (data: CheckInFormData) => {
    setIsSubmitting(true);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const startDateTime = new Date(`${today}T${data.startTime}:00`);
      
      const employeeData = {
        name: data.name,
        startTime: startDateTime,
        revenueCenter: data.revenueCenter,
      };
      
      storage.createEmployee(employeeData);
      
      // Trigger event for other components to update
      window.dispatchEvent(new CustomEvent('localStorageUpdate'));
      
      form.reset({
        name: "",
        startTime: new Date().toTimeString().slice(0, 5),
        revenueCenter: "",
      });
      
      toast({
        title: "Success",
        description: "Employee checked in successfully",
      });
      
      onEmployeeAdded?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check in employee",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <h2 className="text-lg font-semibold text-foreground flex items-center">
          <UserPlus className="text-primary w-5 h-5 mr-2" />
          Employee Check-In
        </h2>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter name" 
                      data-testid="input-employee-name"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <Input 
                      type="time" 
                      data-testid="input-start-time"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="revenueCenter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Revenue Center</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-revenue-center">
                        <SelectValue placeholder="Select Center" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="dining">Dining</SelectItem>
                      <SelectItem value="lounge">Lounge</SelectItem>
                      <SelectItem value="patio">Patio</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex items-end">
              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
                data-testid="button-check-in"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {isSubmitting ? "Checking In..." : "Check In"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
