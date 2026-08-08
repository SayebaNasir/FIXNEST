import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const STATUS_STYLES = {
  pending: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  accepted: "bg-blue-50 text-blue-700 border border-blue-200",
  completed: "bg-green-50 text-green-700 border border-green-200",
  rejected: "bg-red-50 text-red-700 border border-red-200",
};

const ProviderRequests = () => {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [message, setMessage] = useState("");
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("pending");

  useEffect(() => {
    console.log("User:", user);
    // if (!user || user.role !== "provider") {
    //   navigate("/");
    //   return;
    // }
    fetchRequests();
  }, [user, token, navigate]);

  const fetchRequests = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/requests",);
      setRequests(res.data || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    setUpdatingId(id);
    setMessage("");
    try {
      const res = await axios.patch(
        `http://localhost:5000/api/requests/${id}/status`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setRequests((prev) => prev.map((r) => (r._id === id ? res.data : r)));
      setMessage(
        status === "accepted" ? "Request accepted." : "Request rejected.",
      );
    } catch (error) {
      console.error("Error updating request status:", error);
      setMessage("Failed to update request. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredRequests = requests.filter((r) =>
    filter === "all" ? true : r.status === filter,
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-primary-900 text-white">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Incoming Requests
            </h1>
            <p className="mt-2 text-primary-100">
              Review customer requests and accept the ones you can take on.
            </p>
          </div>

          <div className="p-8">
            {message && (
              <div
                className={`mb-6 p-4 rounded-xl text-sm font-medium ${message.includes("accepted") ? "bg-green-50 text-green-700 border border-green-200" : message.includes("rejected") ? "bg-slate-50 text-slate-700 border border-slate-200" : "bg-red-50 text-red-700 border border-red-200"}`}
              >
                {message}
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-6">
              {["pending", "accepted", "completed", "rejected", "all"].map(
                (f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-full text-sm font-bold capitalize transition-all ${
                      filter === f
                        ? "bg-primary-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {f}
                  </button>
                ),
              )}
            </div>

            <div className="space-y-4">
              {filteredRequests.length === 0 && (
                <div className="p-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl">
                  No {filter !== "all" ? filter : ""} requests right now.
                </div>
              )}

              {filteredRequests.map((r) => (
                <div
                  key={r._id}
                  className="p-6 border border-slate-200 rounded-xl"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-slate-900">{r.userName}</p>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold capitalize ${STATUS_STYLES[r.status] || STATUS_STYLES.pending}`}
                        >
                          {r.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        {r.userEmail}
                      </p>
                      <p className="text-sm text-slate-600 mt-1">
                        {r.userAddress}
                      </p>
                      <p className="text-sm text-slate-700 mt-2">
                        {r.description}
                      </p>
                      <p className="text-xs text-slate-400 mt-2">
                        {r.date ? new Date(r.date).toLocaleDateString() : ""}{" "}
                        {r.time && `• ${r.time}`}
                      </p>
                    </div>

                    {r.status === "pending" && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleStatusChange(r._id, "accepted")}
                          disabled={updatingId === r._id}
                          className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 transition-all shadow-sm active:scale-[0.98]"
                        >
                          {updatingId === r._id ? "..." : "Accept"}
                        </button>
                        <button
                          onClick={() => handleStatusChange(r._id, "rejected")}
                          disabled={updatingId === r._id}
                          className="px-4 py-2 rounded-xl text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 transition-all shadow-sm active:scale-[0.98]"
                        >
                          {updatingId === r._id ? "..." : "Reject"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderRequests;
