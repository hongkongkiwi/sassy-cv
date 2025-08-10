'use client';

import React, { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { AdminLayout } from '@/components/AdminLayout';
import { Card } from '@/components/ui/Card';

export default function AnalyticsPage() {
  const { userId } = useAuth();
  const [timeRange, setTimeRange] = useState('30');
  
  const analytics = useQuery(api.analytics.getAnalyticsOverview, userId ? { userId } : 'skip');

  if (!userId) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Analytics</h1>
          <p className="text-gray-600">Please sign in to view analytics.</p>
        </div>
      </AdminLayout>
    );
  }

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon, 
    color = 'blue' 
  }: {
    title: string;
    value: string | number;
    change?: string;
    icon: string;
    color?: 'blue' | 'green' | 'purple' | 'orange';
  }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600'
    };

    return (
      <Card hover className="group cursor-default">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {change && (
              <p className="text-sm text-green-600 font-medium mt-1">
                {change}
              </p>
            )}
          </div>
          <div className={`w-12 h-12 bg-gradient-to-r ${colorClasses[color]} rounded-xl flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform duration-200`}>
            {icon}
          </div>
        </div>
      </Card>
    );
  };

  const DeviceChart = ({ data }: { data: Record<string, number> }) => {
    const total = Object.values(data).reduce((sum, count) => sum + count, 0);
    const deviceIcons = {
      desktop: '💻',
      mobile: '📱',
      tablet: '📋'
    };

    if (total === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>No device data available yet</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {Object.entries(data).map(([device, count]) => {
          const percentage = ((count / total) * 100).toFixed(1);
          return (
            <div key={device} className="flex items-center gap-3">
              <span className="text-xl">{deviceIcons[device as keyof typeof deviceIcons] || '📱'}</span>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium capitalize">{device}</span>
                  <span className="text-sm text-gray-600">{count} ({percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const ActivityChart = ({ data }: { data: Array<{ date: string; views: number }> }) => {
    const maxViews = Math.max(...data.map(d => d.views));
    
    if (maxViews === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>No activity data available yet</p>
          <p className="text-sm mt-1">Views will appear here once people visit your CV</p>
        </div>
      );
    }

    return (
      <div className="flex items-end gap-1 h-40 overflow-x-auto">
        {data.map((day, index) => (
          <div 
            key={day.date} 
            className="flex flex-col items-center gap-1 group min-w-[20px]"
          >
            <div className="text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white px-2 py-1 rounded whitespace-nowrap">
              {day.views} views on {new Date(day.date).toLocaleDateString()}
            </div>
            <div 
              className="bg-gradient-to-t from-blue-500 to-purple-500 rounded-t min-w-[16px] hover:from-blue-600 hover:to-purple-600 transition-colors duration-200"
              style={{ 
                height: `${maxViews > 0 ? Math.max((day.views / maxViews) * 100, 2) : 2}%`,
              }}
            />
            <div className="text-xs text-gray-500 transform -rotate-45 origin-top-left mt-2">
              {new Date(day.date).getDate()}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Track your CV&#39;s performance and visitor engagement
          </p>
        </div>

        {analytics ? (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Views"
                value={analytics.totalViews}
                change={`+${analytics.viewsThisWeek} this week`}
                icon="👁️"
                color="blue"
              />
              <StatCard
                title="PDF Downloads"
                value={analytics.totalDownloads}
                change={`+${analytics.downloadsToday} today`}
                icon="📄"
                color="green"
              />
              <StatCard
                title="Unique Visitors"
                value={analytics.uniqueVisitors}
                icon="👥"
                color="purple"
              />
              <StatCard
                title="Views Today"
                value={analytics.viewsToday}
                icon="🚀"
                color="orange"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Activity Chart */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Daily Views (Last 30 Days)
                </h3>
                <ActivityChart data={analytics.recentActivity as Array<{ date: string; views: number }>} />
              </Card>

              {/* Device Breakdown */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Device Breakdown
                </h3>
                <DeviceChart data={analytics.deviceBreakdown} />
              </Card>
            </div>

            {/* Geographic Data */}
            {Object.keys(analytics.countryBreakdown).length > 0 && (
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Visitors by Country
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(analytics.countryBreakdown)
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .slice(0, 8)
                    .map(([country, count]) => (
                      <div key={country} className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl mb-1">🌍</div>
                        <div className="font-semibold text-gray-900">{count as number}</div>
                        <div className="text-xs text-gray-600">{country}</div>
                      </div>
                    ))}
                </div>
              </Card>
            )}

            {/* Tips */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Growth Tips</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Increase Visibility</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Share your CV link on LinkedIn</li>
                    <li>• Add it to your email signature</li>
                    <li>• Include in job applications</li>
                    <li>• Share on professional networks</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Optimize Performance</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Keep content updated regularly</li>
                    <li>• Use AI suggestions to improve</li>
                    <li>• Customize for target roles</li>
                    <li>• Monitor peak viewing times</li>
                  </ul>
                </div>
              </div>
            </Card>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        )}

        {/* No Data State */}
        {analytics && analytics.totalViews === 0 && (
          <Card className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Analytics Data Yet</h3>
            <p className="text-gray-600 mb-6">
              Start sharing your CV to see analytics data here. Your public CV is available at:
            </p>
            {typeof window !== 'undefined' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 inline-block">
                <code className="text-blue-800">{window.location.origin}</code>
              </div>
            )}
            <p className="text-sm text-gray-500 mt-4">
              Analytics will automatically start tracking once people visit your CV
            </p>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}