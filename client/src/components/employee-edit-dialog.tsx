import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateEmployeeSchema, type Employee, type UpdateEmployee } from "@shared/schema";
import { storage } from "@/lib/localStorage";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Save, X } from "lucide-react";
import { z } from "zod";

const editFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().optional(),
  unpaidBreakMinutes: z.coerce.number().min(0, "Break minutes must be positive"),
});

type EditFormData = z.infer<typeof editFormSchema>;

interface EmployeeEditDialogProps {
  employee: Employee;
  onClose?: () => void;
}

export function EmployeeEditDialog({ employee, onClose }: EmployeeEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const formatDateTimeForInput = (date: Date | string | null): string => {
    if (!date) return "";
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 16);
  };

  const formatTimeForInput = (date: Date | string | null): string => {
    if (!date) return "";
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    return d.toTimeString().slice(0, 5);
  };

  const form = useForm<EditFormData>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      name: employee.name,
      startTime: formatTimeForInput(employee.startTime),
      endTime: formatTimeForInput(employee.endTime),
      unpaidBreakMinutes: employee.unpaidBreakMinutes || 0,
    },
  });

  const onSubmit = async (data: EditFormData) => {
    setIsUpdating(true);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const updateData: Partial<Employee> = {
        name: data.name,
        startTime: new Date(`${today}T${data.startTime}:00`),
        endTime: data.endTime ? new Date(`${today}T${data.endTime}:00`) : null,
        unpaidBreakMinutes: data.unpaidBreakMinutes,
      };
      
      storage.updateEmployee(employee.id, updateData);
      
      // Trigger event for other components to update
      window.dispatchEvent(new CustomEvent('localStorageUpdate'));
      
      setOpen(false);
      if (onClose) onClose();
      toast({
        title: "Success",
        description: "Employee updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update employee",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${employee.name}?`)) return;
    
    setIsDeleting(true);
    
    try {
      storage.deleteEmployee(employee.id);
      
      // Trigger event for other components to update
      window.dispatchEvent(new CustomEvent('localStorageUpdate'));
      
      setOpen(false);
      if (onClose) onClose();
      toast({
        title: "Success",
        description: "Employee deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" data-testid={`button-edit-${employee.id}`}>
          <Edit className="w-3 h-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Employee: {employee.name}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter full name" 
                      data-testid="input-edit-employee-name"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="time" 
                        data-testid="input-edit-start-time"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="time" 
                        placeholder="Not set"
                        data-testid="input-edit-end-time"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="unpaidBreakMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unpaid Break (Minutes)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      min="0"
                      step="1"
                      data-testid="input-edit-break-minutes"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-between gap-3">
              <Button 
                type="button" 
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                data-testid="button-delete-employee"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setOpen(false)}
                  data-testid="button-cancel-edit"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isUpdating}
                  data-testid="button-save-employee"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isUpdating ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}