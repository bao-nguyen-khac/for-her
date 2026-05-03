import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { backendUrl, formatPrice } from "../App";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";
import AdminPagination from "../components/AdminPagination";

const PAGE_SIZE = 10;

const Orders = ({ token }) => {
  const [orders, setorders] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchOrdersPage = useCallback(
    async (pageNum) => {
      if (!token) return null;
      const response = await axios.post(
        backendUrl + "/api/order/list",
        { page: pageNum, limit: PAGE_SIZE },
        { headers: { token } },
      );
      return response.data;
    },
    [token],
  );

  const applyOrdersPayload = (data, pageNum) => {
    if (!data?.success) {
      if (data?.message) toast.error(data.message);
      return;
    }
    const pag = data.pagination ?? null;
    if (pag && pageNum > pag.totalPages && pag.totalPages >= 1) {
      setPage(pag.totalPages);
      return;
    }
    setorders(data.orders);
    setPagination(pag);
  };

  const statusHandler = async (event, orderId) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/order/status",
        { orderId, status: event.target.value },
        { headers: { token } },
      );
      if (response.data.success) {
        try {
          const data = await fetchOrdersPage(page);
          applyOrdersPayload(data, page);
        } catch (error) {
          toast.error(error.response?.data?.message || error.message);
        }
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchOrdersPage(page);
        if (cancelled || !data) return;
        applyOrdersPayload(data, page);
      } catch (error) {
        if (!cancelled) {
          toast.error(error.response?.data?.message || error.message);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, page, fetchOrdersPage]);

  return (
    <div>
      <h3>Trang đơn hàng</h3>
      <div>
        {orders.map((order) => (
          <div
            className="grid grid-cols-1 sm:grid-cols-[0.5fr_2fr_1fr] lg:grid-cols-[0.5fr_2fr_1fr_1fr_1fr] gap-3 items-start border-2 border-gray-200 p-5 md:p-8 my-3 md:my-4 text-xs sm:text-sm text-gray-700"
            key={order._id}
          >
            <img className="w-12" src={assets.parcel_icon} alt="" />

            <div>
              <div>
                {order.items.map((item, index) => {
                  if (index === order.items.length - 1) {
                    return (
                      <p className="py-0.5" key={index}>
                        {item.name} X {item.quantity}{" "}
                        <span>{item.size}</span>{" "}
                      </p>
                    );
                  } else {
                    return (
                      <p className="py-0.5" key={index}>
                        {item.name} X {item.quantity} <span>{item.size}</span> ,
                      </p>
                    );
                  }
                })}
              </div>
              <p className="mt-3 mb-2 font-medium">
                {order.address.firstName + " " + order.address.lastName}
              </p>
              <div>
                <p>{order.address.street + ","}</p>
                <p>
                  {order.address.city +
                    ", " +
                    order.address.state +
                    ", " +
                    order.address.country +
                    ", " +
                    order.address.zipcode}
                </p>
              </div>
              <p>{order.address.phone}</p>
            </div>
            <div>
              <p className="text-sm sm:text-[15px]">
                Sản phẩm: {order.items.length}
              </p>
              <p className="mt-3">Phương thức: {order.paymentMethod}</p>
              <p>Thanh toán: {order.payment ? "Đã thanh toán" : "Chưa thanh toán"}</p>
              <p>Ngày: {new Date(order.date).toLocaleDateString()}</p>
            </div>
            <p className="text-sm sm:text-[15px]">
              {formatPrice(order.amount)}
            </p>
            <select
              onChange={(event) => statusHandler(event, order._id)}
              value={order.status}
              className="p-2 font-semibold"
            >
              <option value="Order Placed">Đã đặt hàng</option>
              <option value="Packing">Đang đóng gói</option>
              <option value="Shipped">Đã gửi hàng</option>
              <option value="Out for delivery">Đang giao</option>
              <option value="Delivered">Đã giao</option>
            </select>
          </div>
        ))}
        <AdminPagination
          page={pagination?.page ?? page}
          totalPages={pagination?.totalPages ?? 1}
          total={pagination?.total ?? 0}
          pageSize={pagination?.limit ?? PAGE_SIZE}
          onPageChange={setPage}
          itemLabel="đơn hàng"
        />
      </div>
    </div>
  );
};

export default Orders;
