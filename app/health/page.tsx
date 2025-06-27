"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Database, CheckCircle, XCircle, AlertTriangle } from "@/components/ui/icons";
import { apiClient } from "@/lib/api/client";

interface BasicHealth {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  service: string;
  error?: string;
}

interface DatabaseHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  isConnected: boolean;
  responseTime?: number;
  lastChecked: string;
  database?: string;
  host?: string;
  error?: string;
}

export default function AdminHealthPage() {
  const { user } = useAuth();
  const [basicHealth, setBasicHealth] = useState<BasicHealth | null>(null);
  const [databaseHealth, setDatabaseHealth] = useState<DatabaseHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchHealthData();
    }
  }, [user]);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch basic health using apiClient (goes through frontend proxy)
      const basicResponse = await apiClient.get<BasicHealth>('/health');
      setBasicHealth(basicResponse.data);

      // Fetch database health using apiClient
      const dbResponse = await apiClient.get<DatabaseHealth>('/health/database');
      setDatabaseHealth(dbResponse.data);

      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching health data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch health data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'healthy':
        return 'default';
      case 'degraded':
        return 'secondary';
      case 'unhealthy':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
              <p className="text-red-600">Only administrators can access the health monitoring page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">System Health Monitoring</h1>
            <p className="text-gray-600">Real-time system status and database connectivity (Admin Only)</p>
          </div>
          <Button 
            onClick={fetchHealthData} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <div className="text-sm text-gray-500 mt-2">
          Last updated: {lastRefresh.toLocaleString()}
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <h3 className="font-medium text-red-900">Error Loading Health Data</h3>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && !basicHealth && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mr-3" />
              <span>Loading health data...</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {/* Basic Service Health */}
        {basicHealth && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                Service Status
              </CardTitle>
              <CardDescription>
                Overall service availability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                {getStatusIcon(basicHealth.status)}
                <Badge variant={getStatusBadge(basicHealth.status)} className="text-sm">
                  {basicHealth.status.toUpperCase()}
                </Badge>
                <span className="text-gray-600 text-sm">
                  {basicHealth.service} - {new Date(basicHealth.timestamp).toLocaleString()}
                </span>
              </div>
              {basicHealth.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg mt-4">
                  <p className="text-red-800 text-sm font-mono">{basicHealth.error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Database Health */}
        {databaseHealth && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Database className="h-6 w-6" />
                Database Status
              </CardTitle>
              <CardDescription>
                Database connectivity and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-6">
                {getStatusIcon(databaseHealth.status)}
                <Badge variant={getStatusBadge(databaseHealth.status)} className="text-sm">
                  {databaseHealth.status.toUpperCase()}
                </Badge>
                {databaseHealth.responseTime && (
                  <span className="text-gray-600 text-sm">
                    Response time: {databaseHealth.responseTime}ms
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Connection Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={databaseHealth.isConnected ? 'text-green-600' : 'text-red-600'}>
                        {databaseHealth.isConnected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                    {databaseHealth.database && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Database:</span>
                        <span>{databaseHealth.database}</span>
                      </div>
                    )}
                    {databaseHealth.host && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Host:</span>
                        <span>{databaseHealth.host}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Checked:</span>
                      <span>{new Date(databaseHealth.lastChecked).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {databaseHealth.error && (
                  <div>
                    <h3 className="font-medium text-red-900 mb-3">Error Details</h3>
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 text-sm font-mono">{databaseHealth.error}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Info */}
        <Card>
          <CardHeader>
            <CardTitle>About This Health Check</CardTitle>
            <CardDescription>
              Information about the health monitoring system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <p className="text-gray-600">
                This admin page provides real-time status information about the Arts Tutoring platform services and infrastructure.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Healthy - All systems operational</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Degraded - Reduced performance</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Unhealthy - Service issues</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}