import { type Employee, type RevenueCenter } from "@shared/schema";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { BarChart3, TrendingUp, TrendingDown, Users } from "lucide-react";

interface SummaryDashboardProps {
  employees: Employee[];
  revenueCenters: RevenueCenter[];
  calculateHours: (employee: Employee) => number;
}

export function SummaryDashboard({ employees, revenueCenters, calculateHours }: SummaryDashboardProps) {
  const totalLaborHours = employees.reduce((sum, emp) => sum + calculateHours(emp), 0);
  const totalSales = revenueCenters.reduce((sum, center) => sum + (Number(center.sales) || 0), 0);
  const overallDollarsPerHour = totalLaborHours > 0 ? totalSales / totalLaborHours : 0;
  const totalPerfectHours = revenueCenters.reduce((sum, center) => {
    const sales = Number(center.sales) || 0;
    const divisor = Number(center.divisor) || 0;
    return sum + (sales > 0 && divisor > 0 ? sales / divisor : 0);
  }, 0);
  
  const laborEfficiencyDiff = totalLaborHours - totalPerfectHours;
  const isOverStaffed = laborEfficiencyDiff > 0;
  const targetRevenuePerHour = 85.00;
  const isAboveTarget = overallDollarsPerHour > targetRevenuePerHour;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-foreground flex items-center">
          <BarChart3 className="text-primary w-5 h-5 mr-2" />
          Summary Dashboard
        </h2>
      </CardHeader>
      
      <CardContent>
        {/* Main Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
          <div className="col-span-2 text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border dark:border-blue-800/30">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-total-labor-hours">
              {totalLaborHours.toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">Total Labor Hours</div>
          </div>
          
          <div className="col-span-2 text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border dark:border-green-800/30">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400" data-testid="text-total-sales">
              ${totalSales.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">Total Sales</div>
          </div>
          
          <div className="col-span-2 text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border dark:border-purple-800/30">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400" data-testid="text-overall-dollars-per-hour">
              ${overallDollarsPerHour.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">Overall $/Hour</div>
          </div>

          <div className="col-span-2 text-center p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border dark:border-amber-800/30">
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400" data-testid="text-total-perfect-hours">
              {totalPerfectHours.toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">Total Perfect Hours</div>
          </div>
        </div>

        {/* Performance Indicators */}
        <div>
          <h3 className="text-md font-semibold text-foreground mb-4">Performance Indicators</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-items-center max-w-2xl mx-auto">
            <div className={`p-4 rounded-lg border ${isOverStaffed ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/30' : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/30'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Labor Efficiency</span>
                {isOverStaffed ? (
                  <TrendingUp className="text-amber-500 w-5 h-5" />
                ) : (
                  <TrendingDown className="text-red-500 w-5 h-5" />
                )}
              </div>
              <div className="mt-1">
                <span className={`text-lg font-semibold ${isOverStaffed ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`} data-testid="text-labor-efficiency-status">
                  {isOverStaffed ? 'Over-staffed' : 'Under-staffed'}
                </span>
                <p className="text-sm text-muted-foreground" data-testid="text-labor-efficiency-diff">
                  {isOverStaffed 
                    ? `${laborEfficiencyDiff.toFixed(1)} excess hours`
                    : `Need ${Math.abs(laborEfficiencyDiff).toFixed(1)} more hours for optimal staffing`
                  }
                </p>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Active Staff</span>
                <Users className="text-blue-500 w-5 h-5" />
              </div>
              <div className="mt-1">
                <span className="text-lg font-semibold text-blue-600 dark:text-blue-400" data-testid="text-active-staff-count">
                  {employees.length} Employees
                </span>
                <p className="text-sm text-muted-foreground">Across all revenue centers</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
