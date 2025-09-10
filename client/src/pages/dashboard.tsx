import { type Employee, type RevenueCenter } from "@shared/schema";
import { EmployeeCheckIn } from "../components/employee-check-in";
import { RevenueCenterCard } from "../components/revenue-center-card";
import { SummaryDashboard } from "../components/summary-dashboard";
import { HistoricalLaborTracker } from "../components/historical-labor-tracker";
import { ThemeToggle } from "../components/theme-toggle";
import { storage } from "../lib/localStorage";
import { BarChart3, Clock, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [revenueCenters, setRevenueCenters] = useState<RevenueCenter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load data from localStorage
  const loadData = () => {
    try {
      const activeEmployees = storage.getActiveEmployees();
      const allEmployeesData = storage.getEmployees();
      const centers = storage.getRevenueCenters();
      
      setEmployees(activeEmployees);
      setAllEmployees(allEmployeesData);
      setRevenueCenters(centers);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetCalculator = () => {
    const confirmMessage = `Are you sure you want to reset the calculator? This will clear all employee data and reset all sales values to zero. This action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
      try {
        // Clear all employees
        storage.clearAllEmployees();
        
        // Reset all revenue center sales to 0
        const centers = storage.getRevenueCenters();
        centers.forEach(center => {
          storage.updateRevenueCenter(center.name, { sales: 0 });
        });
        
        // Trigger event for other components to update
        window.dispatchEvent(new CustomEvent('localStorageUpdate'));
        
        loadData();
        
        toast({
          title: "Success",
          description: "Calculator has been reset - all data cleared",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to reset calculator",
          variant: "destructive",
        });
      }
    }
  };

  useEffect(() => {
    // Load initial data
    loadData();
    
    // Set up time update interval
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Set up storage event listener for cross-tab synchronization
    const handleStorageChange = () => {
      loadData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for same-tab updates
    window.addEventListener('localStorageUpdate', handleStorageChange);

    return () => {
      clearInterval(timer);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageUpdate', handleStorageChange);
    };
  }, []);

  const calculateEmployeeHours = (employee: Employee): number => {
    if (!employee || !employee.startTime) return 0;
    
    const start = typeof employee.startTime === 'string' ? new Date(employee.startTime) : employee.startTime;
    const end = employee.endTime ? (typeof employee.endTime === 'string' ? new Date(employee.endTime) : employee.endTime) : currentTime;
    
    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    
    let diffMs = end.getTime() - start.getTime();
    
    // Handle overnight shifts - if end time appears to be before start time,
    // it means the shift crossed midnight, so add 24 hours
    if (diffMs < 0) {
      diffMs += 24 * 60 * 60 * 1000; // Add 24 hours in milliseconds
    }
    
    const totalHours = Math.max(0, diffMs / (1000 * 60 * 60));
    const unpaidBreakHours = (employee.unpaidBreakMinutes || 0) / 60;
    return Math.max(0, totalHours - unpaidBreakHours);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-inter">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile Header */}
          <div className="flex flex-col sm:hidden py-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BarChart3 className="text-primary w-5 h-5 mr-2" />
                <h1 className="text-lg font-semibold text-foreground">Labour Link</h1>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 mr-1" />
                  {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
                <ThemeToggle variant="mobile" />
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleResetCalculator}
              className="w-full"
              data-testid="button-reset-calculator"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Reset Calculator
            </Button>
          </div>
          
          {/* Desktop Header */}
          <div className="hidden sm:flex justify-between items-center h-16">
            <div className="flex items-center">
              <BarChart3 className="text-primary w-6 h-6 mr-3" />
              <h1 className="text-xl font-semibold text-foreground">Labour Link Calculator</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="w-4 h-4 mr-1" />
                Current Time: {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
              <ThemeToggle variant="desktop" />
              <Button
                variant="destructive"
                size="sm"
                onClick={handleResetCalculator}
                data-testid="button-reset-calculator"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Reset Calculator
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Employee Check-In */}
        <EmployeeCheckIn onEmployeeAdded={loadData} />

        {/* Revenue Center Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {revenueCenters.map((center) => {
            const centerEmployees = employees.filter(emp => emp.revenueCenter === center.name);
            const allCenterEmployees = allEmployees.filter(emp => emp.revenueCenter === center.name);
            return (
              <RevenueCenterCard 
                key={center.name}
                center={center}
                employees={centerEmployees}
                allEmployees={allCenterEmployees}
                calculateHours={calculateEmployeeHours}
                onDataChanged={loadData}
              />
            );
          })}
        </div>

        {/* Summary Dashboard */}
        <SummaryDashboard 
          employees={employees}
          revenueCenters={revenueCenters}
          calculateHours={calculateEmployeeHours}
        />

        {/* Historical Labor Tracker */}
        <div className="mt-6">
          <HistoricalLaborTracker 
            employees={allEmployees}
            revenueCenters={revenueCenters}
            calculateHours={calculateEmployeeHours}
          />
        </div>
      </div>
    </div>
  );
}
