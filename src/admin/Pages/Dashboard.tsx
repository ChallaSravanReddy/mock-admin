import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, CheckCircle2, Users, TrendingUp } from 'lucide-react';
import { analyticsService } from '../services';
import { AnalyticsMetrics } from '../types';

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setIsLoading(true);
        const data = await analyticsService.getAnalyticsMetrics();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to load metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMetrics();
  }, []);

  const statsCards = [
    {
      icon: BookOpen,
      label: 'Total Mock Tests',
      value: metrics?.totalMockTests ?? 0,
      change: '+2 this month',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: CheckCircle2,
      label: 'Total Questions',
      value: metrics?.totalQuestions ?? 0,
      change: '+15 this week',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: Users,
      label: 'Total Attempts',
      value: metrics?.totalAttempts ?? 0,
      change: '+5 today',
      color: 'from-green-500 to-green-600',
    },
    {
      icon: TrendingUp,
      label: 'Average Score',
      value: `${metrics?.averageScore ?? 0}%`,
      change: 'Consistent',
      color: 'from-orange-500 to-orange-600',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your admin dashboard. Here's an overview of your platform.</p>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardDescription className="text-xs">{stat.label}</CardDescription>
                    <CardTitle className="text-2xl font-bold mt-2">{stat.value}</CardTitle>
                  </div>
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color} text-white`}>
                    <IconComponent size={20} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-green-600 font-medium">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Published Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Published Tests</CardTitle>
            <CardDescription>Tests actively available for users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-end gap-4">
                <div>
                  <p className="text-4xl font-bold text-blue-600">{metrics?.publishedTests ?? 0}</p>
                  <p className="text-sm text-gray-600 mt-1">Published</p>
                </div>
                <div className="flex-1 h-20 bg-gradient-to-t from-blue-500 to-blue-200 rounded-lg opacity-50"></div>
              </div>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View all tests →
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Completion Rate</span>
                <span className="font-bold text-gray-900">76%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Avg. Time</span>
                <span className="font-bold text-gray-900">24 min</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Pass Rate</span>
                <span className="font-bold text-gray-900">68%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
