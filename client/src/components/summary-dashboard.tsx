import { type Employee, type RevenueCenter } from "@shared/schema";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { BarChart3, TrendingUp, TrendingDown, Users } from "lucide-react";

interface SummaryDashboardProps {
  employees: Employee[];
  revenueCenters: RevenueCenter[];
  calculateHours: (startTime: string | Date) => number;
}

export function SummaryDashboard({ employees, revenueCenters, calculateHours }: SummaryDashboardProps) {
  const totalLaborHours = employees.reduce((sum, emp) => sum + calculateHours(emp.startTime), 0);
  const totalSales = revenueCenters.reduce((sum, center) => sum + center.sales, 0);
  const overallDollarsPerHour = totalLaborHours > 0 ? totalSales / totalLaborHours : 0;
  const totalPerfectHours = revenueCenters.reduce((sum, center) => {
    return sum + (center.sales > 0 && center.divisor > 0 ? center.sales / center.divisor : 0);
  }, 0);
  
  const laborEfficiencyDiff = totalLaborHours - totalPerfectHours;
  const isOverStaffed = laborEfficiencyDiff > 0;
  const targetRevenuePerHour = 85.00;
  const isAboveTarget = overallDollarsPerHour > targetRevenuePerHour;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <BarChart3 className="text-blue-600 w-5 h-5 mr-2" />
          Summary Dashboard
        </h2>
      </CardHeader>
      
      <CardContent>
        {/* Main Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
          <div className="col-span-2 text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600" data-testid="text-total-labor-hours">
              {totalLaborHours.toFixed(1)}
            </div>
            <div className="text-sm text-gray-700">Total Labor Hours</div>
          </div>
          
          <div className="col-span-2 text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600" data-testid="text-total-sales">
              ${totalSales.toFixed(2)}
            </div>
            <div className="text-sm text-gray-700">Total Sales</div>
          </div>
          
          <div className="col-span-2 text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-3xl font-bold text-purple-600" data-testid="text-overall-dollars-per-hour">
              ${overallDollarsPerHour.toFixed(2)}
            </div>
            <div className="text-sm text-gray-700">Overall $/Hour</div>
          </div>

          <div className="col-span-2 text-center p-4 bg-amber-50 rounded-lg">
            <div className="text-3xl font-bold text-amber-600" data-testid="text-total-perfect-hours">
              {totalPerfectHours.toFixed(1)}
            </div>
            <div className="text-sm text-gray-700">Total Perfect Hours</div>
          </div>
        </div>

        {/* Performance Indicators */}
        <div>
          <h3 className="text-md font-semibold text-gray-900 mb-4">Performance Indicators</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border ${isOverStaffed ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Labor Efficiency</span>
                {isOverStaffed ? (
                  <TrendingUp className="text-amber-500 w-5 h-5" />
                ) : (
                  <TrendingDown className="text-red-500 w-5 h-5" />
                )}
              </div>
              <div className="mt-1">
                <span className={`text-lg font-semibold ${isOverStaffed ? 'text-amber-600' : 'text-red-600'}`} data-testid="text-labor-efficiency-status">
                  {isOverStaffed ? 'Over-staffed' : 'Under-staffed'}
                </span>
                <p className="text-sm text-gray-600" data-testid="text-labor-efficiency-diff">
                  {isOverStaffed 
                    ? `${laborEfficiencyDiff.toFixed(1)} excess hours`
                    : `Need ${Math.abs(laborEfficiencyDiff).toFixed(1)} more hours for optimal staffing`
                  }
                </p>
              </div>
            </div>
            
            <div className={`p-4 rounded-lg border ${isAboveTarget ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Revenue per Hour</span>
                {isAboveTarget ? (
                  <TrendingUp className="text-green-500 w-5 h-5" />
                ) : (
                  <TrendingDown className="text-red-500 w-5 h-5" />
                )}
              </div>
              <div className="mt-1">
                <span className={`text-lg font-semibold ${isAboveTarget ? 'text-green-600' : 'text-red-600'}`} data-testid="text-revenue-status">
                  {isAboveTarget ? 'Above Target' : 'Below Target'}
                </span>
                <p className="text-sm text-gray-600" data-testid="text-revenue-comparison">
                  ${overallDollarsPerHour.toFixed(2)}/hr vs ${targetRevenuePerHour.toFixed(2)} target
                </p>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Active Staff</span>
                <Users className="text-blue-500 w-5 h-5" />
              </div>
              <div className="mt-1">
                <span className="text-lg font-semibold text-blue-600" data-testid="text-active-staff-count">
                  {employees.length} Employees
                </span>
                <p className="text-sm text-gray-600">Across all revenue centers</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
