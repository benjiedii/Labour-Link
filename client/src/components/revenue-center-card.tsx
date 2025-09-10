import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateRevenueCenterSchema, type RevenueCenter, type Employee } from "@shared/schema";
import { storage } from "@/lib/localStorage";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Utensils, Wine, Leaf, LogOut } from "lucide-react";
import { EmployeeEditDialog } from "./employee-edit-dialog";
import { z } from "zod";

const updateCenterSchema = updateRevenueCenterSchema.extend({
  sales: z.coerce.number().min(0, "Sales must be positive"),
  divisor: z.coerce.number().min(0.1, "Divisor must be greater than 0"),
});

const checkoutSchema = z.object({
  endTime: z.string().min(1, "End time is required"),
});

type UpdateCenterFormData = z.infer<typeof updateCenterSchema>;
type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface RevenueCenterCardProps {
  center: RevenueCenter;
  employees: Employee[];
  allEmployees: Employee[];
  calculateHours: (employee: Employee) => number;
  onDataChanged?: () => void;
}

const centerConfig = {
  dining: {
    icon: Utensils,
    bgColor: "bg-dining",
    textColor: "text-dining",
    bgOpacity: "bg-dining/10",
    focusRing: "focus:ring-dining",
  },
  lounge: {
    icon: Wine,
    bgColor: "bg-lounge",
    textColor: "text-lounge",
    bgOpacity: "bg-lounge/10",
    focusRing: "focus:ring-lounge",
  },
  patio: {
    icon: Leaf,
    bgColor: "bg-patio",
    textColor: "text-patio",
    bgOpacity: "bg-patio/10",
    focusRing: "focus:ring-patio",
  },
};

export function RevenueCenterCard({ center, employees, allEmployees, calculateHours, onDataChanged }: RevenueCenterCardProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  
  const config = centerConfig[center.name as keyof typeof centerConfig];
  const Icon = config?.icon || Utensils;

  const form = useForm<UpdateCenterFormData>({
    resolver: zodResolver(updateCenterSchema),
    defaultValues: {
      sales: center.sales || 0,
      divisor: center.divisor || 0,
    },
  });

  const checkoutForm = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      endTime: new Date().toTimeString().slice(0, 5),
    },
  });

  const handleUpdateCenter = async (data: UpdateCenterFormData) => {
    setIsUpdating(true);
    
    try {
      storage.updateRevenueCenter(center.name, data);
      
      // Trigger event for other components to update
      window.dispatchEvent(new CustomEvent('localStorageUpdate'));
      
      toast({
        title: "Success",
        description: `${center.name.charAt(0).toUpperCase() + center.name.slice(1)} center updated`,
      });
      
      onDataChanged?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update revenue center",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const openCheckoutDialog = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setCheckoutDialogOpen(true);
    // Reset form with current time
    checkoutForm.reset({
      endTime: new Date().toTimeString().slice(0, 5),
    });
  };

  const handleCheckoutEmployee = async (data: CheckoutFormData) => {
    if (!selectedEmployeeId) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const endDateTime = new Date(`${today}T${data.endTime}:00`);
      
      storage.updateEmployee(selectedEmployeeId, { 
        isActive: "false",
        endTime: endDateTime
      });
      
      // Trigger event for other components to update
      window.dispatchEvent(new CustomEvent('localStorageUpdate'));
      
      setCheckoutDialogOpen(false);
      setSelectedEmployeeId(null);
      
      toast({
        title: "Success",
        description: "Employee checked out successfully",
      });
      
      onDataChanged?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to checkout employee",
        variant: "destructive",
      });
    }
  };

  const totalHours = allEmployees.reduce((sum, emp) => sum + calculateHours(emp), 0);
  const sales = Number(center.sales) || 0;
  const divisor = Number(center.divisor) || 0;
  const perfectHours = sales > 0 && divisor > 0 ? sales / divisor : 0;
  const dollarsPerHour = totalHours > 0 ? sales / totalHours : 0;

  const handleFormChange = () => {
    const currentValues = form.getValues();
    if (currentValues.sales !== center.sales || currentValues.divisor !== center.divisor) {
      handleUpdateCenter(currentValues);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className={`${config?.bgColor || 'bg-blue-600'} text-white px-6 py-4`}>
        <h3 className="text-lg font-semibold flex items-center">
          <Icon className="w-5 h-5 mr-2" />
          {center.name.charAt(0).toUpperCase() + center.name.slice(1)}
        </h3>
      </div>
      
      <CardContent className="p-6">
        <Form {...form}>
          <form className="space-y-4">
            <FormField
              control={form.control}
              name="sales"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Sales ($)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      step="0.01"
                      data-testid={`input-${center.name}-sales`}
                      {...field}
                      value={field.value === 0 ? "" : String(field.value)}
                      onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                      onBlur={handleFormChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="divisor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target DPH</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0.0" 
                      step="0.1"
                      data-testid={`input-${center.name}-divisor`}
                      {...field}
                      value={field.value === 0 ? "" : String(field.value)}
                      onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                      onBlur={handleFormChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>

        {/* Metrics Display */}
        <div className="grid grid-cols-2 gap-4 my-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className={`text-2xl font-bold ${config?.textColor || 'text-blue-600'}`} data-testid={`text-${center.name}-total-hours`}>
              {totalHours.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Total Hours</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600" data-testid={`text-${center.name}-perfect-hours`}>
              {perfectHours.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Perfect Hours</div>
          </div>
        </div>

        <div className={`text-center p-3 ${config?.bgOpacity || 'bg-blue-600/10'} rounded-lg mb-4`}>
          <div className={`text-2xl font-bold ${config?.textColor || 'text-blue-600'}`} data-testid={`text-${center.name}-dollars-per-hour`}>
            ${dollarsPerHour.toFixed(2)}
          </div>
          <div className="text-sm text-gray-700">Dollars per Hour</div>
        </div>

        {/* Employee Groups */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            All Employees ({allEmployees.length})
          </h4>
          
          {/* Active Employees Section */}
          {employees.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <h5 className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                  Active ({employees.length})
                </h5>
              </div>
              <div className="space-y-2">
                {employees.map((employee) => (
                  <div key={employee.id} className="flex justify-between items-center p-2 bg-green-50 border border-green-200 rounded">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-green-900" data-testid={`text-employee-${employee.id}`}>
                        {employee.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600" data-testid={`text-hours-${employee.id}`}>
                        {calculateHours(employee).toFixed(1)}hrs
                      </span>
                      <EmployeeEditDialog employee={employee} />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openCheckoutDialog(employee.id)}
                        disabled={false}
                        data-testid={`button-checkout-${employee.id}`}
                      >
                        <LogOut className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Clocked Out Employees Section */}
          {(() => {
            const clockedOutEmployees = allEmployees.filter(emp => emp.isActive === "false");
            return clockedOutEmployees.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Clocked Out ({clockedOutEmployees.length})
                  </h5>
                </div>
                <div className="space-y-2">
                  {clockedOutEmployees.map((employee) => (
                    <div key={employee.id} className="flex justify-between items-center p-2 bg-gray-50 border border-gray-200 rounded">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-600" data-testid={`text-employee-${employee.id}`}>
                          {employee.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600" data-testid={`text-hours-${employee.id}`}>
                          {calculateHours(employee).toFixed(1)}hrs
                        </span>
                        <EmployeeEditDialog employee={employee} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
          
          {/* No Employees State */}
          {allEmployees.length === 0 && (
            <div className="p-3 bg-gray-50 rounded text-center text-gray-500 text-sm">
              No employees
            </div>
          )}
        </div>
      </CardContent>
      
      {/* Checkout Time Dialog */}
      <Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check Out Employee</DialogTitle>
          </DialogHeader>
          
          <Form {...checkoutForm}>
            <form onSubmit={checkoutForm.handleSubmit(handleCheckoutEmployee)} className="space-y-4">
              <FormField
                control={checkoutForm.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Checkout Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="time" 
                        data-testid="input-checkout-time"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setCheckoutDialogOpen(false)}
                  data-testid="button-cancel-checkout"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  data-testid="button-confirm-checkout"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Check Out
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
