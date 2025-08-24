import { useState } from "react";
import { type Employee, type RevenueCenter } from "@shared/schema";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Clock, History, TrendingUp, Users } from "lucide-react";

interface HistoricalLaborTrackerProps {
  employees: Employee[];
  revenueCenters: RevenueCenter[];
  calculateHours: (employee: Employee) => number;
}

export function HistoricalLaborTracker({ employees, revenueCenters, calculateHours }: HistoricalLaborTrackerProps) {
  const [selectedTime, setSelectedTime] = useState("");
  const [historicalData, setHistoricalData] = useState<{
    totalHours: number;
    centerBreakdown: Array<{
      name: string;
      hours: number;
      sales: number;
      dollarsPerHour: number;
      employees: Array<{ name: string; hours: number }>;
    }>;
    timestamp: string;
  } | null>(null);

  const calculateHistoricalHours = (employee: Employee, targetTime: Date): number => {
    if (!employee || !employee.startTime) return 0;
    
    const start = typeof employee.startTime === 'string' ? new Date(employee.startTime) : employee.startTime;
    
    // If employee started after target time, they weren't working
    if (start.getTime() > targetTime.getTime()) return 0;
    
    // Determine the end time for calculation
    let end: Date;
    if (employee.endTime) {
      const empEnd = typeof employee.endTime === 'string' ? new Date(employee.endTime) : employee.endTime;
      // Use the earlier of target time or actual end time
      end = empEnd.getTime() < targetTime.getTime() ? empEnd : targetTime;
    } else {
      // Employee is still active, so use target time
      end = targetTime;
    }
    
    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    
    const diffMs = end.getTime() - start.getTime();
    const totalHours = Math.max(0, diffMs / (1000 * 60 * 60));
    const unpaidBreakHours = (employee.unpaidBreakMinutes || 0) / 60;
    return Math.max(0, totalHours - unpaidBreakHours);
  };

  const calculateHistoricalData = () => {
    if (!selectedTime) return;
    
    const today = new Date().toISOString().split('T')[0];
    const targetDateTime = new Date(`${today}T${selectedTime}:00`);
    
    // Calculate total hours and breakdown by revenue center
    const centerBreakdown = revenueCenters.map(center => {
      const centerEmployees = employees.filter(emp => emp.revenueCenter === center.name);
      const employeeDetails = centerEmployees.map(emp => ({
        name: emp.name,
        hours: calculateHistoricalHours(emp, targetDateTime)
      })).filter(emp => emp.hours > 0);
      
      const centerHours = employeeDetails.reduce((sum, emp) => sum + emp.hours, 0);
      const dollarsPerHour = centerHours > 0 ? center.sales / centerHours : 0;
      
      return {
        name: center.name,
        hours: centerHours,
        sales: center.sales,
        dollarsPerHour,
        employees: employeeDetails
      };
    });
    
    const totalHours = centerBreakdown.reduce((sum, center) => sum + center.hours, 0);
    
    setHistoricalData({
      totalHours,
      centerBreakdown,
      timestamp: targetDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-lg">Historical Labor Tracker</CardTitle>
        </div>
        <p className="text-sm text-gray-600">See what labor hours were at any time today</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time Selection */}
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Time
            </label>
            <Input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              data-testid="input-historical-time"
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setSelectedTime(getCurrentTime())}
              variant="outline"
              size="sm"
              data-testid="button-current-time"
            >
              <Clock className="w-4 h-4 mr-1" />
              Now
            </Button>
            <Button 
              onClick={calculateHistoricalData}
              disabled={!selectedTime}
              data-testid="button-calculate-historical"
            >
              Calculate
            </Button>
          </div>
        </div>

        {/* Historical Data Display */}
        {historicalData && (
          <div className="mt-6 space-y-4">
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                Labor Hours as of {historicalData.timestamp}
              </h3>
              
              {/* Total Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-blue-900">
                          {historicalData.totalHours.toFixed(1)}
                        </div>
                        <div className="text-sm text-blue-700">Total Labor Hours</div>
                      </div>
                      <Users className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-green-900">
                          ${revenueCenters.reduce((sum, c) => sum + c.sales, 0).toFixed(0)}
                        </div>
                        <div className="text-sm text-green-700">Total Sales</div>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-orange-900">
                          ${historicalData.totalHours > 0 ? (revenueCenters.reduce((sum, c) => sum + c.sales, 0) / historicalData.totalHours).toFixed(0) : '0'}
                        </div>
                        <div className="text-sm text-orange-700">$/Hour Overall</div>
                      </div>
                      <Clock className="w-8 h-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Center Labor Breakdown */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-800 mb-4">Labor Hours by Revenue Center</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {historicalData.centerBreakdown.map((center) => {
                    const centerConfig = {
                      dining: { color: 'emerald', icon: '🍽️' },
                      lounge: { color: 'purple', icon: '🍷' }, 
                      patio: { color: 'orange', icon: '🌿' }
                    };
                    const config = centerConfig[center.name.toLowerCase() as keyof typeof centerConfig] || { color: 'blue', icon: '🏢' };
                    
                    return (
                      <Card key={center.name} className={`border-2 border-${config.color}-200 bg-${config.color}-50`}>
                        <CardContent className="p-4">
                          <div className="text-center mb-4">
                            <div className="text-2xl mb-2">{config.icon}</div>
                            <h5 className={`font-semibold text-lg capitalize text-${config.color}-800 mb-1`}>
                              {center.name}
                            </h5>
                            <div className={`text-3xl font-bold text-${config.color}-900 mb-1`}>
                              {center.hours.toFixed(1)}
                            </div>
                            <div className="text-sm text-gray-600 mb-2">Labor Hours</div>
                            <div className={`text-lg font-semibold text-${config.color}-700`}>
                              ${center.dollarsPerHour.toFixed(0)}/hr
                            </div>
                          </div>
                          
                          {center.employees.length > 0 && (
                            <div className="border-t border-gray-200 pt-3">
                              <h6 className="text-xs font-medium text-gray-700 mb-2 text-center">
                                Employees Working ({center.employees.length})
                              </h6>
                              <div className="space-y-1">
                                {center.employees.map((emp) => (
                                  <div key={emp.name} className="flex justify-between items-center text-sm bg-white px-2 py-1 rounded border">
                                    <span className="font-medium text-gray-700">{emp.name}</span>
                                    <span className={`text-${config.color}-600 font-semibold`}>
                                      {emp.hours.toFixed(1)}h
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {center.employees.length === 0 && (
                            <div className="border-t border-gray-200 pt-3 text-center">
                              <span className="text-sm text-gray-500">No employees working</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {!historicalData && (
          <div className="text-center py-8 text-gray-500">
            <History className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>Select a time and click Calculate to view historical labor data</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}