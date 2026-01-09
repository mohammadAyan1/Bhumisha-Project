import { useEffect, useMemo, useState } from "react";
import companyAPI from "../../axios/companyAPI";
import { toast } from "react-toastify";
import { useCompany } from "../../contexts/CompanyContext";

const emptyForm = {
  code: "",
  name: "",
  address: "",
  gst_no: "",
  contact_no: "",
  email: "",
  owner_name: "",
  status: "Active",
  image_url: "",
  // bank fields (flat in form; will be sent as nested 'bank' JSON)
  bank_name: "",
  branch_name: "",
  account_number: "",
  ifsc_code: "",
  upi_id: "",
  pan_number: "",
  account_holder_name: "",
};

export default function CompaniesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [selected, setSelected] = useState(
    localStorage.getItem("company_code") || ""
  );
  const { setActiveCompany } = useCompany();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data } = await companyAPI.getAll();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      const msg =
        e?.response?.data?.error || e.message || "Failed to load companies";
      setRows([]);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAll();
  }, []);

  const image_urls = import.meta.env.VITE_IMAGE_URL;

  const filtered = useMemo(() => {
    const term = (q || "").toLowerCase().trim();
    if (!term) return rows;
    return rows.filter((r) =>
      [r.code, r.name, r.gst_no, r.contact_no, r.owner_name, r.status]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [rows, q]);

  const onChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!form.code.trim()) return "Code is required";
    if (!form.name.trim()) return "Name is required";
    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      toast.error(v);
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("code", form.code.trim().toLowerCase());
      formData.append("name", form.name);
      formData.append("address", form.address);
      formData.append("gst_no", form.gst_no);
      formData.append("contact_no", form.contact_no);
      formData.append("email", form.email);
      formData.append("owner_name", form.owner_name);
      formData.append("status", form.status);

      if (form.imageFile) {
        formData.append("logo", form.imageFile); // ✅ key must match multer
      }
      // Build bank payload only if any bank field provided
      const bankPayload = {
        bank_name: (form.bank_name || "").trim(),
        branch_name: (form.branch_name || "").trim(),
        account_number: (form.account_number || "").trim(),
        ifsc_code: (form.ifsc_code || "").trim(),
        upi_id: (form.upi_id || "").trim(),
        pan_number: (form.pan_number || "").trim(),
        account_holder_name: (form.account_holder_name || "").trim(),
      };
      const anyBank = Object.values(bankPayload).some((v) => v);
      if (anyBank) {
        formData.append("bank", JSON.stringify(bankPayload));
      }

      if (editId) {
        await companyAPI.update(editId, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await companyAPI.create(formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      toast.success(
        editId ? "Company updated successfully" : "Company created successfully"
      );
      if (!editId) {
        localStorage.setItem("company_code", form.code);
        setSelected(form.code);
      }
      setForm(emptyForm);
      setShowForm(false);
      await fetchAll();
      try {
        const current = rows.find(
          (r) =>
            String(r.code).toLowerCase() === String(form.code).toLowerCase()
        );
        if (current) setActiveCompany(current);
      } catch {}
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const onEdit = (row) => {
    setEditId(row.id);

    setForm({
      code: row.code || "",
      name: row.name || "",
      address: row.address || "",
      gst_no: row.gst_no || "",
      contact_no: row.contact_no || "",
      email: row.email || "",
      owner_name: row.owner_name || "",
      image_url: `${image_urls}${row?.image_url}`,

      status: row.status || "Active",

      bank_name: "",
      branch_name: "",
      account_number: "",
      ifsc_code: "",
      upi_id: "",
      pan_number: "",
      account_holder_name: "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSelect = (code) => {
    const cc = String(code || "").toLowerCase();
    localStorage.setItem("company_code", cc);
    setSelected(cc);
    const found = rows.find((r) => String(r.code).toLowerCase() === cc);
    if (found) {
      setActiveCompany(found);
    }
    toast.success(`Selected company ${cc.toUpperCase()}`);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex rounded-md items-center justify-between mb-4 bg-white shadow-md p-3">
        <h2 className="text-xl font-bold">Companies</h2>
        <button
          type="button"
          onClick={() => (showForm ? setShowForm(false) : setShowForm(true))}
          className={`px-4 py-2 rounded-lg text-white ${
            showForm ? "bg-gray-600" : "bg-green-600"
          }`}
          title={showForm ? "Close form" : "Add new company"}
        >
          {showForm ? "Close Form" : "+ Add Company"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={onSubmit}
          className="bg-white shadow-lg rounded-xl p-6 mb-6"
        >
          <h3 className="text-lg font-semibold mb-4">
            {editId ? "Update Company" : "Create Company"}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Company Code</label>
              <input
                name="code"
                className="border p-2 rounded-lg"
                value={form.code}
                onChange={onChange}
                required
                readOnly={editId}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Name</label>
              <input
                name="name"
                className="border p-2 rounded-lg"
                value={form.name}
                onChange={onChange}
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">GST No</label>
              <input
                name="gst_no"
                className="border p-2 rounded-lg"
                value={form.gst_no}
                onChange={onChange}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Contact</label>
              <input
                name="contact_no"
                type="number"
                className="border p-2 rounded-lg"
                onInput={(e) => {
                  // Limit to 6 digits
                  if (e.target.value.length > 10) {
                    e.target.value = e.target.value.slice(0, 10);
                  }
                }}
                value={form.contact_no}
                onChange={onChange}
              />
            </div>

            <div className="flex flex-col md:col-span-2">
              <label className="text-sm text-gray-600 mb-1">Address</label>
              <input
                name="address"
                className="border p-2 rounded-lg"
                value={form.address}
                onChange={onChange}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Owner</label>
              <input
                name="owner_name"
                className="border p-2 rounded-lg"
                value={form.owner_name}
                onChange={onChange}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Email</label>
              <input
                name="email"
                className="border p-2 rounded-lg"
                value={form.email}
                onChange={onChange}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Logo</label>

              <input
                type="file"
                accept="image/*"
                name="logo"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const previewUrl = URL.createObjectURL(file);
                    setForm((prev) => ({
                      ...prev,
                      image_url: previewUrl, // store preview in state
                      imageFile: file, // optional: store actual file for upload later
                    }));
                  }
                }}
                className="border p-2 rounded-lg"
              />

              {form.image_url && (
                <img
                  src={form.image_url}
                  alt="Logo Preview"
                  className="mt-2 w-24 h-24 object-cover rounded-lg border"
                />
              )}
            </div>

            {/* Bank Details */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Bank Name</label>
                <input
                  name="bank_name"
                  className="border p-2 rounded-lg"
                  value={form.bank_name}
                  onChange={onChange}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">
                  Branch Name
                </label>
                <input
                  name="branch_name"
                  className="border p-2 rounded-lg"
                  value={form.branch_name}
                  onChange={onChange}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  name="account_number"
                  className="border p-2 rounded-lg"
                  value={form.account_number}
                  onChange={onChange}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">IFSC Code</label>
                <input
                  name="ifsc_code"
                  className="border p-2 rounded-lg"
                  value={form.ifsc_code}
                  onChange={onChange}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">UPI ID</label>
                <input
                  name="upi_id"
                  className="border p-2 rounded-lg"
                  value={form.upi_id}
                  onChange={onChange}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">PAN Number</label>
                <input
                  name="pan_number"
                  className="border p-2 rounded-lg"
                  value={form.pan_number}
                  onChange={onChange}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">
                  Account Holder Name
                </label>
                <input
                  name="account_holder_name"
                  className="border p-2 rounded-lg"
                  value={form.account_holder_name}
                  onChange={onChange}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 md:col-span-2 mt-2 justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                {editId ? "Update" : "Create"}
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 rounded-lg"
                onClick={() => {
                  setForm(emptyForm);
                  setEditId(null);
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="bg-white shadow-lg rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Companies</h3>
          <input
            className="border p-2 rounded-lg w-60"
            placeholder="Search..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">S.No.</th>
                  <th className="p-2 border">Company Code</th>
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">GST No.</th>
                  <th className="p-2 border">Contact</th>
                  <th className="p-2 border">Owner</th>
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border">Actions</th>
                  <th className="p-2 border">logo</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-gray-50 text-center">
                    <td className="p-2 border">{idx + 1}</td>
                    <td className="p-2 border font-mono">
                      {r.code.toUpperCase()}
                    </td>
                    <td className="p-2 border">{r.name}</td>
                    <td className="p-2 border">{r.gst_no || "-"}</td>
                    <td className="p-2 border">{r.contact_no || "-"}</td>
                    <td className="p-2 border">{r.owner_name || "-"}</td>
                    <td className="p-2 border">{r.status || "-"}</td>
                    <td className="p-2 border">
                      <div className="flex gap-2">
                        <button
                          className="px-3 py-1 bg-blue-600 text-white rounded"
                          onClick={() => onEdit(r)}
                        >
                          Edit
                        </button>
                        {/* <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={()=> onDelete(r.id)}>Delete</button> */}
                        <button
                          className={`px-3 py-1 rounded ${
                            selected === r.code?.toLowerCase()
                              ? "bg-green-600 text-white"
                              : "border"
                          }`}
                          onClick={() => onSelect(r.code)}
                        >
                          {selected === r.code?.toLowerCase()
                            ? "Selected"
                            : "Select"}
                        </button>
                      </div>
                    </td>
                    <td className="p-2 border">
                      {r.image_url && (
                        <img
                          src={`${image_urls}${r.image_url}`}
                          alt="Company Logo"
                          className="w-16 h-16 object-contain mx-auto"
                          onError={(e) => {
                            e.target.src =
                              "https://via.placeholder.com/64?text=No+Image";
                          }}
                        />
                      )}
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td className="p-4 text-center" colSpan={8}>
                      No companies found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-3 text-sm text-gray-600">
        Current company:{" "}
        <span className="font-mono">{selected || "(none)"}</span>
      </div>
    </div>
  );
}
