import React, { useState, useEffect } from "react";
import axios from "axios";
import { backendUrl, formatPrice } from "../App";
import { toast } from "react-toastify";
import { RevenueLineChart, OrderStatusDoughnutChart } from "../components/DashboardCharts";

const Home = ({ token }) => {
  const [range, setRange] = useState("all");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${backendUrl}/api/stats/dashboard?range=${range}`, {
          headers: { token },
        });
        if (response.data.success) {
          setStats(response.data.data);
        } else {
          toast.error(response.data.message || "Lỗi tải số liệu thống kê");
        }
      } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token, range]);

  // Render color badge for order status
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Order Placed":
        return "bg-blue-50 text-blue-600 border border-blue-200";
      case "Packing":
        return "bg-amber-50 text-amber-600 border border-amber-200";
      case "Shipped":
        return "bg-purple-50 text-purple-600 border border-purple-200";
      case "Out for delivery":
        return "bg-cyan-50 text-cyan-600 border border-cyan-200";
      case "Delivered":
        return "bg-emerald-50 text-emerald-600 border border-emerald-200";
      default:
        return "bg-gray-50 text-gray-600 border border-gray-200";
    }
  };

  const getStatusText = (status) => {
    const texts = {
      "Order Placed": "Đã đặt hàng",
      "Packing": "Đang đóng gói",
      "Shipped": "Đã gửi hàng",
      "Out for delivery": "Đang giao hàng",
      "Delivered": "Đã giao hàng",
    };
    return texts[status] || status;
  };

  if (loading && !stats) {
    // Shimmer/Skeleton Loading State
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-9 w-36 bg-gray-200 rounded" />
        </div>

        {/* Overview cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5 h-24" />
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 h-80" />
          <div className="bg-white border border-gray-200 rounded-xl p-6 h-80" />
        </div>

        {/* Tables skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 h-72" />
          <div className="bg-white border border-gray-200 rounded-xl p-6 h-72" />
        </div>
      </div>
    );
  }

  const { totals = {}, statusDistribution = {}, topProducts = [], recentOrders = [], chart = {} } = stats || {};

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Quản Trị</h1>
          <p className="text-xs text-gray-500 mt-0.5">Theo dõi hiệu quả hoạt động kinh doanh tổng quan</p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Thời gian:</label>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg text-sm px-3 py-1.5 font-medium text-gray-700 outline-none focus:border-pink-300 focus:ring-1 focus:ring-pink-300 transition-all cursor-pointer"
          >
            <option value="today">Hôm nay</option>
            <option value="7days">7 ngày qua</option>
            <option value="30days">30 ngày qua</option>
            <option value="all">Toàn thời gian</option>
          </select>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs flex items-center justify-between transition-all hover:shadow-sm">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Doanh thu</p>
            <p className="text-xl font-bold text-gray-800 mt-1">{formatPrice(totals.revenue)}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Khoảng thời gian đã chọn</p>
          </div>
          <div className="p-3 bg-pink-50 text-pink-500 rounded-xl shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Card 2: Orders */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs flex items-center justify-between transition-all hover:shadow-sm">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Số đơn hàng</p>
            <p className="text-xl font-bold text-gray-800 mt-1">{totals.orders}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Khoảng thời gian đã chọn</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-500 rounded-xl shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
        </div>

        {/* Card 3: Products (All Time) */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs flex items-center justify-between transition-all hover:shadow-sm">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Tổng sản phẩm</p>
            <p className="text-xl font-bold text-gray-800 mt-1">{totals.products}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Tổng số lượng trong kho</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-500 rounded-xl shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        </div>

        {/* Card 4: Users (All Time) */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs flex items-center justify-between transition-all hover:shadow-sm">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Khách hàng</p>
            <p className="text-xl font-bold text-gray-800 mt-1">{totals.users}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Đã đăng ký tài khoản</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueLineChart labels={chart.labels} data={chart.data} />
        </div>
        <div>
          <OrderStatusDoughnutChart distribution={statusDistribution} />
        </div>
      </div>

      {/* Top Products & Recent Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top selling products */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs flex flex-col">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-800">Top 5 sản phẩm bán chạy</h2>
            <p className="text-xs text-gray-500">Sắp xếp theo số lượng bán được</p>
          </div>

          <div className="flex flex-col gap-3.5 my-auto">
            {topProducts.length > 0 ? (
              topProducts.map((p, index) => (
                <div key={index} className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="font-bold text-sm text-gray-400 w-4">{index + 1}</div>
                  <img
                    className="w-12 h-12 rounded-lg object-cover bg-gray-100 border border-gray-100 shrink-0"
                    src={p.image || "https://forhershop.vn/wp-content/uploads/2026/03/AD05244-QUA40XMI-2-1365x2048.webp"}
                    alt={p.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "https://forhershop.vn/wp-content/uploads/2026/03/AD05244-QUA40XMI-2-1365x2048.webp";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Doanh thu: {formatPrice(p.revenue)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-gray-800">{p.quantity}</span>
                    <span className="text-[10px] text-gray-400 ml-1">đã bán</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-gray-400">Không có dữ liệu bán hàng trong kỳ</div>
            )}
          </div>
        </div>

        {/* Recent orders */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs flex flex-col">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-800">Đơn hàng mới nhận</h2>
            <p className="text-xs text-gray-500">Danh sách các đơn hàng gần đây</p>
          </div>

          <div className="overflow-x-auto my-auto">
            {recentOrders.length > 0 ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-semibold">
                    <th className="pb-3 font-medium">Khách hàng</th>
                    <th className="pb-3 font-medium">Ngày đặt</th>
                    <th className="pb-3 font-medium">Tổng tiền</th>
                    <th className="pb-3 font-medium text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 font-medium text-gray-800">
                        {order.address?.receiverName || [order.address?.firstName, order.address?.lastName].filter(Boolean).join(' ') || 'Khách hàng'}
                      </td>
                      <td className="py-3.5 text-gray-500">
                        {new Date(order.date).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="py-3.5 font-bold text-gray-800">
                        {formatPrice(order.amount)}
                      </td>
                      <td className="py-3.5 text-right">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadgeClass(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-xs text-gray-400">Không có đơn hàng nào trong kỳ</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
