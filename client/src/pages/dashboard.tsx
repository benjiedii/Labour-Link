import { useQuery } from "@tanstack/react-query";
import { type Employee, type RevenueCenter } from "@shared/schema";
import { EmployeeCheckIn } from "../components/employee-check-in";
import { RevenueCenterCard } from "../components/revenue-center-card";
import { SummaryDashboard } from "../components/summary-dashboard";
import { BarChart3, Clock } from "lucide-react";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());

  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees/active"],
  });

  const { data: allEmployees = [], isLoading: allEmployeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: revenueCenters = [], isLoading: centersLoading } = useQuery<RevenueCenter[]>({
    queryKey: ["/api/revenue-centers"],
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const calculateEmployeeHours = (employee: Employee): number => {
    if (!employee || !employee.startTime) return 0;
    
    const start = typeof employee.startTime === 'string' ? new Date(employee.startTime) : employee.startTime;
    const end = employee.endTime ? (typeof employee.endTime === 'string' ? new Date(employee.endTime) : employee.endTime) : currentTime;
    
    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    
    const diffMs = end.getTime() - start.getTime();
    const totalHours = Math.max(0, diffMs / (1000 * 60 * 60));
    const unpaidBreakHours = (employee.unpaidBreakMinutes || 0) / 60;
    return Math.max(0, totalHours - unpaidBreakHours);
  };

  if (employeesLoading || centersLoading || allEmployeesLoading) {
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
    <div className="min-h-screen bg-gray-50 font-inter">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BarChart3 className="text-blue-600 w-6 h-6 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Labor Hours Calculator</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-1" />
                Current Time: {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Employee Check-In */}
        <EmployeeCheckIn />

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
      </div>
    </div>
  );
}
