import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateRevenueCenterSchema, type RevenueCenter, type Employee } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Utensils, Wine, Leaf, LogOut } from "lucide-react";
import { z } from "zod";

const updateCenterSchema = updateRevenueCenterSchema.extend({
  sales: z.coerce.number().min(0, "Sales must be positive"),
  divisor: z.coerce.number().min(0.1, "Divisor must be greater than 0"),
});

type UpdateCenterFormData = z.infer<typeof updateCenterSchema>;

interface RevenueCenterCardProps {
  center: RevenueCenter;
  employees: Employee[];
  calculateHours: (startTime: string | Date) => number;
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

export function RevenueCenterCard({ center, employees, calculateHours }: RevenueCenterCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const config = centerConfig[center.name as keyof typeof centerConfig];
  const Icon = config?.icon || Utensils;

  const form = useForm<UpdateCenterFormData>({
    resolver: zodResolver(updateCenterSchema),
    defaultValues: {
      sales: center.sales,
      divisor: center.divisor,
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateCenterFormData) => {
      const response = await apiRequest("PATCH", `/api/revenue-centers/${center.name}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/revenue-centers"] });
      toast({
        title: "Success",
        description: `${center.name.charAt(0).toUpperCase() + center.name.slice(1)} center updated`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update revenue center",
        variant: "destructive",
      });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const response = await apiRequest("PATCH", `/api/employees/${employeeId}/checkout`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees/active"] });
      toast({
        title: "Success",
        description: "Employee checked out successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to checkout employee",
        variant: "destructive",
      });
    },
  });

  const totalHours = employees.reduce((sum, emp) => sum + calculateHours(emp.startTime), 0);
  const perfectHours = center.sales > 0 && center.divisor > 0 ? center.sales / center.divisor : 0;
  const dollarsPerHour = totalHours > 0 ? center.sales / totalHours : 0;

  const handleFormChange = () => {
    const currentValues = form.getValues();
    if (currentValues.sales !== center.sales || currentValues.divisor !== center.divisor) {
      updateMutation.mutate(currentValues);
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
                  <FormLabel>Perfect Hours Divisor</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0.0" 
                      step="0.1"
                      data-testid={`input-${center.name}-divisor`}
                      {...field}
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

        {/* Active Employees */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Active Employees ({employees.length})
          </h4>
          <div className="space-y-2">
            {employees.length === 0 ? (
              <div className="p-3 bg-gray-50 rounded text-center text-gray-500 text-sm">
                No active employees
              </div>
            ) : (
              employees.map((employee) => (
                <div key={employee.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-medium text-gray-900" data-testid={`text-employee-${employee.id}`}>
                    {employee.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600" data-testid={`text-hours-${employee.id}`}>
                      {calculateHours(employee.startTime).toFixed(1)}hrs
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => checkoutMutation.mutate(employee.id)}
                      disabled={checkoutMutation.isPending}
                      data-testid={`button-checkout-${employee.id}`}
                    >
                      <LogOut className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
