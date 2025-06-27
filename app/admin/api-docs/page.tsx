"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, BookOpen, Database, Server, Eye, XCircle, CheckCircle } from "@/components/ui/icons";
import { apiClient } from "@/lib/api/client";

interface ApiEndpoint {
  method: string;
  path: string;
  fullPath: string;
  handler: string;
  controller: string;
  description?: string;
  roles?: string[];
  guards?: string[];
  params?: string[];
  body?: string;
  response?: string;
}

interface ApiController {
  name: string;
  path: string;
  description?: string;
  endpoints: ApiEndpoint[];
}

interface ApiSpecification {
  controllers: ApiController[];
  totalEndpoints: number;
  lastGenerated: string;
}

export default function ApiDocsPage() {
  const { user } = useAuth();
  const [apiSpec, setApiSpec] = useState<ApiSpecification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedController, setSelectedController] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMethod, setFilterMethod] = useState<string>("ALL");

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchApiSpec();
    }
  }, [user]);

  const fetchApiSpec = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get<ApiSpecification>('/api-docs/specification');
      setApiSpec(response.data);
      if (response.data.controllers.length > 0 && !selectedController) {
        setSelectedController(response.data.controllers[0].name);
      }
    } catch (err) {
      console.error('Error fetching API specification:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch API specification');
    } finally {
      setLoading(false);
    }
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'POST':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'PUT':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'PATCH':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'DELETE':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'teacher':
        return 'bg-blue-100 text-blue-800';
      case 'student':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredEndpoints = (controller: ApiController) => {
    let endpoints = controller.endpoints;

    // Filter by search term
    if (searchTerm) {
      endpoints = endpoints.filter(endpoint => 
        endpoint.fullPath.toLowerCase().includes(searchTerm.toLowerCase()) ||
        endpoint.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        endpoint.handler.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by method
    if (filterMethod !== "ALL") {
      endpoints = endpoints.filter(endpoint => endpoint.method.toUpperCase() === filterMethod);
    }

    return endpoints;
  };

  const getEndpointStats = () => {
    if (!apiSpec) return { total: 0, byMethod: {} };

    const byMethod: Record<string, number> = {};
    let total = 0;

    apiSpec.controllers.forEach(controller => {
      controller.endpoints.forEach(endpoint => {
        total++;
        byMethod[endpoint.method] = (byMethod[endpoint.method] || 0) + 1;
      });
    });

    return { total, byMethod };
  };

  const stats = getEndpointStats();

  if (user?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
              <p className="text-red-600">Only administrators can access the API documentation.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">API Documentation</h1>
            <p className="text-gray-600">Complete API specification and endpoint documentation</p>
          </div>
          <Button 
            onClick={fetchApiSpec} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        {apiSpec && (
          <div className="text-sm text-gray-500 mt-2">
            Last generated: {new Date(apiSpec.lastGenerated).toLocaleString()}
          </div>
        )}
      </div>

      {error && (
        <Card className="mb-6 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <h3 className="font-medium text-red-900">Error Loading API Documentation</h3>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && !apiSpec && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mr-3" />
              <span>Loading API specification...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {apiSpec && (
        <div className="space-y-6">
          {/* API Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Database className="h-6 w-6" />
                API Overview
              </CardTitle>
              <CardDescription>
                Summary of available endpoints and controllers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{apiSpec.controllers.length}</div>
                  <div className="text-xs text-blue-700">Controllers</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.total}</div>
                  <div className="text-xs text-green-700">Total Endpoints</div>
                </div>
                {Object.entries(stats.byMethod).map(([method, count]) => (
                  <div key={method} className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-600">{count}</div>
                    <div className="text-xs text-gray-500">{method}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Search and Filter */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search endpoints, paths, or descriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <select
                    value={filterMethod}
                    onChange={(e) => setFilterMethod(e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="ALL">All Methods</option>
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Controllers and Endpoints */}
          <Card>
            <CardHeader>
              <CardTitle>API Endpoints</CardTitle>
              <CardDescription>
                Detailed view of all available API endpoints organized by controller
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedController} onValueChange={setSelectedController}>
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-1 h-auto p-1">
                  {apiSpec.controllers.slice(0, 8).map(controller => (
                    <TabsTrigger 
                      key={controller.name} 
                      value={controller.name}
                      className="text-xs p-2"
                    >
                      {controller.name.replace('Controller', '')}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {apiSpec.controllers.map(controller => (
                  <TabsContent key={controller.name} value={controller.name} className="mt-6">
                    <div className="space-y-4">
                      <div className="border-b pb-4">
                        <h3 className="text-xl font-semibold text-gray-900">{controller.name}</h3>
                        <p className="text-gray-600 text-sm mt-1">{controller.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm text-gray-500">Base Path:</span>
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm">/{controller.path}</code>
                          <span className="text-sm text-gray-500">
                            ({filteredEndpoints(controller).length} endpoints)
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {filteredEndpoints(controller).map((endpoint, index) => (
                          <div key={`${endpoint.fullPath}-${endpoint.method}-${index}`} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Badge className={`${getMethodColor(endpoint.method)} font-mono text-xs px-2 py-1 border`}>
                                  {endpoint.method}
                                </Badge>
                                <code className="bg-gray-100 px-3 py-1 rounded font-mono text-sm">
                                  {endpoint.fullPath}
                                </code>
                              </div>
                              <div className="flex items-center gap-2">
                                {endpoint.roles && endpoint.roles.map(role => (
                                  <Badge key={role} className={`${getRoleColor(role)} text-xs`}>
                                    {role}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <p className="text-sm text-gray-700">{endpoint.description}</p>
                              
                              <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                                <span><strong>Handler:</strong> {endpoint.handler}</span>
                                {endpoint.params && endpoint.params.length > 0 && (
                                  <span><strong>Parameters:</strong> {endpoint.params.join(', ')}</span>
                                )}
                                {endpoint.guards && endpoint.guards.length > 0 && (
                                  <span><strong>Guards:</strong> {endpoint.guards.join(', ')}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                        {filteredEndpoints(controller).length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                            <p>No endpoints match your search criteria</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* OpenAPI Export */}
          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
              <CardDescription>
                Download API specification in various formats. All data is accessed through the frontend (port 3000) API proxy.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant="outline"
                  onClick={async () => {
                    try {
                      const response = await apiClient.get('/api-docs/openapi');
                      const dataStr = JSON.stringify(response.data, null, 2);
                      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                      const exportFileDefaultName = 'openapi-spec.json';
                      const linkElement = document.createElement('a');
                      linkElement.setAttribute('href', dataUri);
                      linkElement.setAttribute('download', exportFileDefaultName);
                      linkElement.click();
                    } catch (error) {
                      console.error('Error downloading OpenAPI spec:', error);
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <Database className="h-4 w-4" />
                  Download OpenAPI 3.0
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    const dataStr = JSON.stringify(apiSpec, null, 2);
                    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                    const exportFileDefaultName = 'api-specification.json';
                    const linkElement = document.createElement('a');
                    linkElement.setAttribute('href', dataUri);
                    linkElement.setAttribute('download', exportFileDefaultName);
                    linkElement.click();
                  }}
                  className="flex items-center gap-2"
                >
                  <Server className="h-4 w-4" />
                  Download JSON
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}