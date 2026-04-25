import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/admin/dashboard")({
  component: () => <DashboardPage />,
});

interface OrderStats {
  totalOrders: number;
  processedOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

interface DailyOrders {
  date: string;
  count: number;
  revenue: number;
}

interface StatusData {
  name: string;
  value: number;
  fill: string;
}

function DashboardPage() {
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    processedOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
  });
  const [dailyData, setDailyData] = useState<DailyOrders[]>([]);
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch all orders with product details
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*, products(name, price)");

      if (ordersError) throw ordersError;

      if (!ordersData || ordersData.length === 0) {
        setLoading(false);
        return;
      }

      // Calculate stats
      const totalOrders = ordersData.length;
      const processedOrders = ordersData.filter((o: any) => o.is_processed).length;
      const pendingOrders = totalOrders - processedOrders;
      const totalRevenue = ordersData.reduce((sum: number, o: any) => sum + (o.products?.price || 0), 0);
      const averageOrderValue = totalRevenue / totalOrders;

      setStats({
        totalOrders,
        processedOrders,
        pendingOrders,
        totalRevenue,
        averageOrderValue,
      });

      // Calculate daily data (last 30 days)
      const dailyMap: { [key: string]: { count: number; revenue: number } } = {};
      ordersData.forEach((order: any) => {
        const date = new Date(order.created_at).toLocaleDateString("en-IN");
        if (!dailyMap[date]) {
          dailyMap[date] = { count: 0, revenue: 0 };
        }
        dailyMap[date].count += 1;
        dailyMap[date].revenue += order.products?.price || 0;
      });

      const dailyArray = Object.entries(dailyMap)
        .map(([date, data]) => ({
          date,
          count: data.count,
          revenue: data.revenue,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-30);

      setDailyData(dailyArray);

      // Status breakdown
      setStatusData([
        { name: "Processed", value: processedOrders, fill: "#16a34a" },
        { name: "Pending", value: pendingOrders, fill: "#eab308" },
      ]);

      // Top products
      const productMap: { [key: string]: { name: string; count: number; revenue: number } } = {};
      ordersData.forEach((order: any) => {
        const productId = order.product_id;
        const productName = order.products?.name || "Unknown";
        const productPrice = order.products?.price || 0;

        if (!productMap[productId]) {
          productMap[productId] = { name: productName, count: 0, revenue: 0 };
        }
        productMap[productId].count += 1;
        productMap[productId].revenue += productPrice;
      });

      const topProductsArray = Object.values(productMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setTopProducts(topProductsArray);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Order summary and analytics overview
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">All time orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.processedOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground mt-1">All orders combined</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.averageOrderValue.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Average per order</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Daily Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Orders by Day</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => value}
                  contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff" }}
                />
                <Bar dataKey="count" fill="#3b82f6" name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
            <CardDescription>Processed vs Pending</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }: any) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
          <CardDescription>Most ordered items</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topProducts.length === 0 ? (
              <p className="text-muted-foreground">No orders yet</p>
            ) : (
              topProducts.map((product, idx) => (
                <div key={idx} className="flex items-center justify-between pb-4 border-b last:border-0">
                  <div className="flex-1">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.count} orders</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{product.revenue.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
