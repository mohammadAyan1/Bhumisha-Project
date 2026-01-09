import React, { useState, useEffect, useRef } from "react";
import productAPI from "../../axios/productAPI";
import categoryAPI from "../../axios/categoryAPI";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const CustomProductForm = () => {
  // Unit conversion constants
  const UNIT_CONVERSIONS = {
    gram: 1,
    kg: 1000,
    ton: 1000000,
    quantal: 100000, // 1 quintal = 100 kg = 100,000 grams
    litter: 1000, // 1 quintal = 100 kg = 100,000 grams
  };

  // Convert quantity to grams based on unit
  const convertToGrams = (quantity, unit) => {
    const qty = Number(quantity) || 0;
    return qty * (UNIT_CONVERSIONS[unit] || 1);
  };

  // Convert grams to target unit
  const convertFromGrams = (grams, unit) => {
    const conversion = UNIT_CONVERSIONS[unit];
    return conversion ? grams / conversion : grams;
  };

  const convertToKg = (quantity, unit) => {
    switch (unit) {
      case "kg":
        return quantity / 1000;
      case "litter":
        return quantity / 1000;
      case "ton":
        return quantity / 1000 / 1000;
      case "quantal":
        return quantity / 1000 / 100;
      default:
        return quantity;
    }
  };

  const navigate = useNavigate();
  const param = useParams();

  useEffect(() => {
    if (!param?.id) return;

    productAPI.getCustomProductById(param?.id).then((res) => {
      const data = res?.data; // because your backend returns [product]
      if (!data) return;

      const customQuantity = convertToKg(data?.size, data?.unit);

      const salesRate = Number(data?.value) - Number(data?.packaging_cost);

      setCustomName(data.product_name);
      setCategorySearch(data.category_name);
      setCustomPurchaseRate(data.purchase_rate);
      setTransportRate(data.transport_charge);
      setLocalTransport(data.local_transport);
      setPackagingCost(data.packaging_cost);
      setHsnCode(data.hsn_code);
      setCustomSaleRate(salesRate);
      setGst(data.gst);
      // setCustomQty(data.size);
      setCustomQty(customQuantity);
      setEditQTY(data?.ingredientsData?.map((i) => i.qty));
      setSelectedCategory({ id: data?.category_id });
      setUnit(data.unit || "gram"); // Set unit from database

      // const selectedProduct = data?.ingredientRows?.

      // setSelectedProduct()

      // ✅ Set ingredients with unit conversion
      const ingredientRows =
        data.ingredientsData?.map((i, index) => {
          const productGrams = convertToGrams(i.size, i.unit);

          console.log("====================================");
          console.log(i);
          console.log("====================================");
          const displayAvailableQty =
            i.unit && i.unit !== "gram"
              ? convertFromGrams(productGrams, i.unit)
              : i.size;

          return {
            id: Date.now(),
            product: i.product,
            productId: i.productId,
            availableQty: displayAvailableQty / 1000, // Display in product's unit
            availableQtyInGrams: productGrams, // Store in grams for validation
            qty: i.qty || "",
            rate: i.value || 0,
            gst: i.gst || "",
            salesRate: i.total || "",
            categoryId: i.category_id || "",
            showDropdown: false,
            dropdownIndex: -1,
            productSearch: i.product_name,
            productUnit: i.unit || "gram", // Store product's unit
            selectedUnit: data?.ingredients?.[index]?.selectedUnit || "gram", // Unit selected in this row
          };
        }) || [];

      setProductRows(ingredientRows);
      setSelectedCategory({ id: data?.category_id });
    });
  }, []);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryDropdownIndex, setCategoryDropdownIndex] = useState(-1);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [editQTY, setEditQTY] = useState("");
  const [stockUpdates, setStockUpdates] = useState({});

  const [productRows, setProductRows] = useState([
    {
      id: Date.now(),
      product: "",
      productId: null,
      availableQty: 0,
      availableQtyInGrams: 0,
      qty: "",
      rate: "",
      salesRate: "",
      showDropdown: false,
      dropdownIndex: -1,
      productSearch: "",
      productUnit: "gram",
      selectedUnit: "gram",
    },
  ]);

  const [customName, setCustomName] = useState("");
  const [transportRate, setTransportRate] = useState("");
  const [localTransport, setLocalTransport] = useState("");
  const [packagingCost, setPackagingCost] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [gst, setGst] = useState("");
  const [customQty, setCustomQty] = useState("");
  const [customPurchaseRate, setCustomPurchaseRate] = useState("");
  const [customSaleRate, setCustomSaleRate] = useState("");
  const [value, setValue] = useState(0);
  const [margin30, setMargin30] = useState("");
  const [margin25, setMargin25] = useState("");
  const [margin50, setMargin50] = useState("");
  const [unit, setUnit] = useState("gram");

  const inputRefs = useRef([]);
  const categoryDropdownRef = useRef(null);
  const productDropdownRefs = useRef({});

  useEffect(() => {}, [stockUpdates]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close category dropdown
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target)
      ) {
        setShowCategoryDropdown(false);
      }

      // Close product dropdowns
      Object.keys(productDropdownRefs.current).forEach((rowId) => {
        const ref = productDropdownRefs.current[rowId];
        if (ref && !ref.contains(event.target)) {
          setProductRows((prev) =>
            prev.map((row) =>
              row.id === parseInt(rowId)
                ? { ...row, showDropdown: false, dropdownIndex: -1 }
                : row
            )
          );
        }
      });
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Fetch categories and products
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoryRes = await categoryAPI.getAll();
        setCategories(categoryRes?.data || []);

        // Fetch products
        const productRes = await productAPI.getAll();
        setProducts(productRes?.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();

    // Auto focus on first input
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 300);
  }, []);

  useEffect(() => {
    // Convert inputs to numbers safely
    const sale = Number(customSaleRate) || 0;
    const packaging = Number(packagingCost) || 0;

    const total = sale + packaging;

    setMargin30((total * 0.3).toFixed(2));
    setMargin25((total * 0.25).toFixed(2));
    setMargin50((total * 0.5).toFixed(2));
  }, [customSaleRate, packagingCost]);

  // Handle Enter key to move to next field
  const handleEnterNext = (e, index) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const nextInput = inputRefs.current[index + 1];
      if (nextInput) nextInput.focus();
    }
  };

  // Category dropdown search + keyboard navigation
  const filteredCategories = categories.filter((c) =>
    c.name?.toLowerCase()?.includes(categorySearch.toLowerCase())
  );

  const handleCategoryKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const newIndex =
        categoryDropdownIndex < filteredCategories.length - 1
          ? categoryDropdownIndex + 1
          : 0;
      setCategoryDropdownIndex(newIndex);

      // Scroll to selected item
      setTimeout(() => {
        const selectedElement = categoryDropdownRef.current?.children[newIndex];
        if (selectedElement) {
          selectedElement.scrollIntoView({ block: "nearest" });
        }
      }, 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const newIndex =
        categoryDropdownIndex > 0
          ? categoryDropdownIndex - 1
          : filteredCategories.length - 1;
      setCategoryDropdownIndex(newIndex);

      // Scroll to selected item
      setTimeout(() => {
        const selectedElement = categoryDropdownRef.current?.children[newIndex];
        if (selectedElement) {
          selectedElement.scrollIntoView({ block: "nearest" });
        }
      }, 0);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const category = filteredCategories[categoryDropdownIndex];
      if (category) {
        setSelectedCategory(category);
        setCategorySearch(category.name);
        setShowCategoryDropdown(false);
        setTimeout(() => inputRefs.current[3]?.focus(), 200);
      }
    } else if (e.key === "Escape") {
      setShowCategoryDropdown(false);
    }
  };

  // Product dropdown handlers for each row
  const handleProductSearchChange = (rowId, value) => {
    setProductRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              productSearch: value,
              showDropdown: true,
              dropdownIndex: -1,
            }
          : row
      )
    );
  };

  const handleProductKeyDown = (e, rowId) => {
    const row = productRows.find((r) => r.id === rowId);
    if (!row) return;

    const filtered = products.filter((p) =>
      p.product_name?.toLowerCase().includes(row.productSearch.toLowerCase())
    );

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const newIndex =
        row.dropdownIndex < filtered.length - 1 ? row.dropdownIndex + 1 : 0;
      setProductRows((prev) =>
        prev.map((r) =>
          r.id === rowId ? { ...r, dropdownIndex: newIndex } : r
        )
      );

      // Scroll to selected item
      setTimeout(() => {
        const selectedElement =
          productDropdownRefs.current[rowId]?.children[newIndex];
        if (selectedElement) {
          selectedElement.scrollIntoView({ block: "nearest" });
        }
      }, 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const newIndex =
        row.dropdownIndex > 0 ? row.dropdownIndex - 1 : filtered.length - 1;
      setProductRows((prev) =>
        prev.map((r) =>
          r.id === rowId ? { ...r, dropdownIndex: newIndex } : r
        )
      );

      // Scroll to selected item
      setTimeout(() => {
        const selectedElement =
          productDropdownRefs.current[rowId]?.children[newIndex];
        if (selectedElement) {
          selectedElement.scrollIntoView({ block: "nearest" });
        }
      }, 0);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (row.dropdownIndex >= 0 && row.dropdownIndex < filtered.length) {
        const product = filtered[row.dropdownIndex];
        handleProductSelect(rowId, product);
      }
    } else if (e.key === "Escape") {
      setProductRows((prev) =>
        prev.map((r) =>
          r.id === rowId ? { ...r, showDropdown: false, dropdownIndex: -1 } : r
        )
      );
    }
  };

  const handleProductSelect = (rowId, product) => {
    const availableQty = product.size || 0;
    const productUnit = product.unit || "gram";
    const availableGrams = convertToGrams(availableQty, "gram");

    // Convert to display unit (keeping same unit as product)
    const displayAvailableQty =
      productUnit !== "gram"
        ? convertFromGrams(availableGrams, "kg")
        : availableQty;

    setProductRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              product: product.product_name,
              productId: product.id,
              availableQty: displayAvailableQty,
              availableQtyInGrams: availableGrams,
              rate: product.purchase_rate || "",
              salesRate: product.total,
              productSearch: product.product_name,
              showDropdown: false,
              dropdownIndex: -1,
              productUnit: productUnit,
              selectedUnit: productUnit, // Set to product's unit by default
            }
          : row
      )
    );
  };

  const handleQtyChange = (rowId, value) => {
    setProductRows((prev) =>
      prev.map((r, i) => {
        if (r.id === rowId) {
          const qty = Number(value);
          const selectedUnit = r.selectedUnit || "gram";
          const enteredGrams = convertToGrams(qty, selectedUnit);

          if (param?.id) {
            // Edit mode
            const alreadyQty = Number(editQTY?.[i] || 0);
            const alreadyGrams = convertToGrams(alreadyQty, r.selectedUnit);
            const availableGrams = Number(r.availableQtyInGrams || 0);
            const allowedGrams = availableGrams + alreadyGrams;

            if (enteredGrams > allowedGrams) {
              const maxInSelectedUnit = convertFromGrams(
                allowedGrams,
                selectedUnit
              );
              toast.error(
                `❌ Quantity exceeds available stock! Maximum: ${maxInSelectedUnit.toFixed(
                  3
                )} ${selectedUnit}`
              );
              return { ...r, qty: maxInSelectedUnit };
            }

            const qtyIncrease = enteredGrams - alreadyGrams;

            setStockUpdates((prevUpdates) => ({
              ...prevUpdates,
              [rowId]: {
                productId: r.productId,
                updatedQty: qtyIncrease,
                unit: "gram", // Always store updates in grams
              },
            }));

            return { ...r, qty };
          } else {
            // Create mode
            if (enteredGrams > r.availableQtyInGrams) {
              const maxInSelectedUnit = convertFromGrams(
                r.availableQtyInGrams,
                selectedUnit
              );
              toast.error(
                `❌ Quantity exceeds available stock! Maximum: ${maxInSelectedUnit.toFixed(
                  3
                )} ${selectedUnit}`
              );
              return { ...r, qty: maxInSelectedUnit };
            }
            return { ...r, qty };
          }
        }
        return r;
      })
    );
  };

  // Handle unit change in product rows
  const handleUnitChange = (rowId, newUnit) => {
    setProductRows((prev) =>
      prev.map((row) => {
        if (row.id === rowId) {
          const currentQty = row.qty;
          let newQty = currentQty;

          // Convert existing quantity to new unit
          if (currentQty && row.selectedUnit) {
            const currentGrams = convertToGrams(currentQty, row.selectedUnit);
            newQty = convertFromGrams(currentGrams, newUnit);

            // Validate against available stock in new unit
            const newQtyGrams = convertToGrams(newQty, newUnit);
            if (newQtyGrams > row.availableQtyInGrams) {
              const maxInNewUnit = convertFromGrams(
                row.availableQtyInGrams,
                newUnit
              );
              toast.error(
                `❌ Quantity exceeds available stock! Maximum: ${maxInNewUnit.toFixed(
                  3
                )} ${newUnit}`
              );
              newQty = maxInNewUnit;
            }
          }

          return {
            ...row,
            selectedUnit: newUnit,
            qty: newQty,
          };
        }
        return row;
      })
    );
  };

  const handleAddRow = () => {
    setProductRows((prev) => [
      ...prev,
      {
        id: Date.now(),
        product: "",
        productId: null,
        availableQty: 0,
        availableQtyInGrams: 0,
        qty: "",
        rate: "",
        showDropdown: false,
        dropdownIndex: -1,
        productSearch: "",
        productUnit: "gram",
        selectedUnit: "gram",
      },
    ]);
  };

  const handleRemoveRow = (id) => {
    setProductRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSubmit = () => {
    // Convert custom product quantity to grams
    const customQtyInGrams = convertToGrams(customQty, unit);

    const selectedProductIds = productRows;

    // const selectedProductForEditTime = products.filter((item)=> item?.id == )

    const payload = {
      customProductName: customName,
      categoryId: selectedCategory?.id || null,
      hsnCode,
      gst,
      customQty: customQtyInGrams, // Store in grams
      unit: unit, // Always store as gram in database
      displayUnit: unit, // Keep original unit for display
      transportRate,
      localTransport,
      packagingCost,
      value,
      rawPrice: Number(customSaleRate) + Number(packagingCost),
      margin30,
      margin25,
      margin50,
      customPurchaseRate,
      customSaleRate:
        Number(customSaleRate) + Number(packagingCost) + Number(margin50),
      stockUpdates,
      selectedProductIds,
    };

    if (param?.id) {
      console.log("====================================");
      console.log(payload);
      console.log("====================================");
      productAPI
        .updateCustomProduct(param?.id, payload)
        .then(() => {
          toast.success("Custom product Updated successfully");
          navigate(-1);
        })
        .catch(() => {
          toast.error("Custom product did not updated");
        });
    } else {
      console.log(payload);
      productAPI
        .createCustom(payload)
        .then(() => {
          toast.success("Custom product added successfully");
          // Reset form
          resetForm();
          // window.location.reload();
        })
        .catch(() => {
          toast.error("Custom product did not added");
        });
    }
  };

  const resetForm = () => {
    setProducts([]);
    setCategories([]);
    setSelectedCategory(null);
    setCategorySearch("");
    setCategoryDropdownIndex(-1);
    setShowCategoryDropdown(false);
    setEditQTY("");
    setStockUpdates({});
    setProductRows([
      {
        id: Date.now(),
        product: "",
        productId: null,
        availableQty: 0,
        availableQtyInGrams: 0,
        qty: "",
        rate: "",
        salesRate: "",
        showDropdown: false,
        dropdownIndex: -1,
        productSearch: "",
        productUnit: "gram",
        selectedUnit: "gram",
      },
    ]);
    setCustomName("");
    setTransportRate("");
    setLocalTransport("");
    setPackagingCost("");
    setHsnCode("");
    setGst("");
    setCustomQty("");
    setCustomPurchaseRate("");
    setCustomSaleRate("");
    setValue(0);
    setMargin30("");
    setMargin25("");
    setMargin50("");
    setUnit("gram");
    // setSelectedCustomProduct(null);
  };

  const selectedCount = productRows.filter((r) => r.product).length;

  return (
    <div className="p-5 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 text-center">
        Custom Product Form
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl shadow-md">
        {/* Product Name */}
        <div className="flex flex-col">
          <label>product name</label>
          <input
            ref={(el) => (inputRefs.current[0] = el)}
            type="text"
            placeholder="Product Name"
            className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => handleEnterNext(e, 0)}
          />
        </div>

        {/* Custom Qty with Unit */}
        <div className="flex flex-col">
          <label>Custom Quantity</label>
          <div className="flex gap-2">
            <input
              ref={(el) => (inputRefs.current[6] = el)}
              type="number"
              step="0.001"
              placeholder="Custom Qty"
              className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400 flex-1"
              value={customQty}
              onChange={(e) => setCustomQty(e.target.value)}
              onKeyDown={(e) => handleEnterNext(e, 6)}
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400 w-32"
            >
              <option value="gram">Gram</option>
              <option value="litter">Liter</option>
              <option value="kg">KG</option>
              <option value="ton">TON</option>
              <option value="quantal">quintal</option>
            </select>
          </div>
        </div>

        {/* Category */}
        <div className="relative">
          <label>Select category</label>
          <input
            ref={(el) => (inputRefs.current[1] = el)}
            type="text"
            placeholder="Select Category"
            className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400 w-full"
            value={categorySearch}
            onFocus={() => setShowCategoryDropdown(true)}
            onChange={(e) => {
              setCategorySearch(e.target.value);
              setShowCategoryDropdown(true);
              setCategoryDropdownIndex(-1);
            }}
            onKeyDown={handleCategoryKeyDown}
          />
          {showCategoryDropdown && (
            <ul
              ref={categoryDropdownRef}
              className="absolute bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto w-full z-20"
            >
              {filteredCategories.map((c, i) => (
                <li
                  key={c.id}
                  onClick={() => {
                    setSelectedCategory(c);
                    setCategorySearch(c.name);
                    setShowCategoryDropdown(false);
                    inputRefs.current[2]?.focus();
                  }}
                  className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${
                    i === categoryDropdownIndex
                      ? "bg-blue-100 border-blue-500 border"
                      : ""
                  }`}
                >
                  {c.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Custom Sale Rate */}
        <div className="flex flex-col">
          <label>Rate</label>
          <input
            ref={(el) => (inputRefs.current[2] = el)}
            type=""
            className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400 w-full "
            value={Number(customSaleRate) || ""}
            placeholder="Custom Sale Rate"
            onChange={(e) => setCustomSaleRate(e.target.value)}
            onKeyDown={(e) => handleEnterNext(e, 2)}
          />
        </div>

        {/* Packaging */}
        <div className="flex flex-col">
          <label>Packaging price</label>
          <input
            ref={(el) => (inputRefs.current[3] = el)}
            type="number"
            placeholder="Packaging Cost"
            className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400"
            value={packagingCost}
            onChange={(e) => setPackagingCost(e.target.value)}
            onKeyDown={(e) => handleEnterNext(e, 3)}
          />
        </div>

        {/* HSN Code */}
        <div className="flex flex-col">
          <label>HSN Number</label>
          <input
            ref={(el) => (inputRefs.current[4] = el)}
            type="text"
            placeholder="HSN Code"
            className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400"
            value={hsnCode}
            onChange={(e) => setHsnCode(e.target.value)}
            onKeyDown={(e) => handleEnterNext(e, 4)}
          />
        </div>

        {/* GST */}
        <div className="flex flex-col">
          <label>GST %</label>
          <input
            ref={(el) => (inputRefs.current[5] = el)}
            type="number"
            placeholder="GST %"
            className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400"
            value={gst}
            onChange={(e) => setGst(e.target.value)}
            onKeyDown={(e) => handleEnterNext(e, 5)}
          />
        </div>

        {/* No. of Products Selected */}
        <div className="flex flex-col">
          <label>selected Number of Item</label>
          <input
            type="text"
            readOnly
            className="border p-2 rounded-lg bg-gray-100 "
            value={`${selectedCount} selected`}
          />
        </div>

        {/* Custom Qty */}
        {/* <div className="flex flex-col">
          <label>Custom Quantity</label>
          <input
            ref={(el) => (inputRefs.current[6] = el)}
            type="number"
            placeholder="Custom Qty"
            className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400"
            value={customQty}
            onChange={(e) => setCustomQty(e.target.value)}
            onKeyDown={(e) => handleEnterNext(e, 6)}
          />
        </div> */}

        {/* 30% Margin */}
        <div className="flex flex-col">
          <label>30% Margin</label>
          <input
            type="text"
            className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400 w-full "
            value={margin30}
            placeholder="5KG 30% Margin"
          />
        </div>

        {/* 25% Margin */}
        <div className="flex flex-col">
          <label>25% Margin</label>
          <input
            type="text"
            className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400 w-full "
            value={margin25}
            placeholder="10KG 25% Margin"
          />
        </div>

        <div className="flex flex-col">
          <label>Sales rate</label>
          <input
            type="text"
            className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400 w-full "
            value={(Number(customSaleRate) + Number(packagingCost)) * 1.5}
            placeholder="Sales rates"
          />
        </div>
      </div>

      {/* Product Rows */}
      <div className="mt-6">
        {productRows.map((row) => {
          const filteredProducts = products.filter((p) =>
            p.product_name
              ?.toLowerCase()
              .includes(row.productSearch.toLowerCase())
          );

          return (
            <div
              key={row.id}
              className="flex flex-wrap gap-3 items-center bg-white p-2 rounded-lg shadow-sm mb-2 relative"
            >
              {/* Product Search Input */}
              <div className="relative flex-1">
                <label>select product</label>
                <input
                  type="text"
                  className="border p-2 rounded-lg w-full"
                  placeholder="Search product..."
                  value={row.productSearch}
                  required
                  onChange={(e) =>
                    handleProductSearchChange(row.id, e.target.value)
                  }
                  onFocus={() =>
                    setProductRows((prev) =>
                      prev.map((r) =>
                        r.id === row.id ? { ...r, showDropdown: true } : r
                      )
                    )
                  }
                  onKeyDown={(e) => handleProductKeyDown(e, row.id)}
                />

                {/* Product Dropdown */}
                {row.showDropdown && (
                  <ul
                    ref={(el) => (productDropdownRefs.current[row.id] = el)}
                    className="absolute bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto w-full z-10 top-full left-0 mt-1"
                  >
                    {filteredProducts.map((product, i) => {
                      if (product?.type == "custom") return;

                      const availableQty = convertToKg(
                        product.size || 0,
                        product?.unit || 0
                      );

                      const convertAvailableFraction = Number(
                        availableQty.toString().match(/^\d+(\.\d{0,2})?/)[0]
                      );
                      // 9.99

                      const isDisabled = availableQty <= 0;

                      return (
                        <li
                          key={product.id}
                          onClick={() =>
                            !isDisabled && handleProductSelect(row.id, product)
                          }
                          className={`px-3 py-2 cursor-pointer ${
                            i === row.dropdownIndex
                              ? "bg-blue-100 border-blue-500 border"
                              : ""
                          } ${
                            isDisabled
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "hover:bg-blue-50"
                          }`}
                        >
                          <div className="flex justify-between">
                            <span>{product.product_name}</span>
                            <span
                              className={`text-sm ${
                                isDisabled ? "text-red-500" : "text-green-600"
                              }`}
                            >
                              Qty: {convertAvailableFraction} {product?.unit}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <div className="flex flex-col">
                <label>Aval qty (kg)</label>
                <input
                  type="text"
                  readOnly
                  className="border p-2 rounded-lg w-28 bg-gray-100 text-center"
                  // value={row.availableQty}
                  value={`${row.availableQty} `}
                  placeholder="Available"
                />
              </div>
              <div className="flex flex-col">
                <label>Purchase rate</label>
                <input
                  type="text"
                  readOnly
                  className="border p-2 rounded-lg w-24 bg-gray-100 text-center"
                  value={row.rate}
                  placeholder="purchase Rate"
                />
              </div>
              <div className="flex flex-col">
                <label>Sales rate</label>
                <input
                  type="text"
                  readOnly
                  className="border p-2 rounded-lg w-24 bg-gray-100 text-center"
                  value={row.salesRate}
                  placeholder="sales Rate"
                />
              </div>

              <div className="flex flex-col">
                <label>QTY</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    step="0.001"
                    className="border p-2 rounded-lg w-28 text-center"
                    value={row.qty === 0 ? "" : row?.qty}
                    min={0}
                    placeholder="Qty"
                    onChange={(e) => handleQtyChange(row.id, e.target.value)}
                  />
                  <select
                    value={row.selectedUnit}
                    onChange={(e) => handleUnitChange(row.id, e.target.value)}
                    className="border p-2 rounded-lg w-24"
                    // disabled={!row.product}
                  >
                    <option value="gram">Gram</option>
                    <option value="litter">Liter</option>
                    <option value="kg">KG</option>
                    <option value="ton">TON</option>
                    <option value="quantal">quintal</option>
                  </select>
                </div>
              </div>

              <div className=" flex flex-col">
                <label></label>
                <button
                  onClick={() => handleRemoveRow(row.id)}
                  className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
        <button
          onClick={handleAddRow}
          className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 mt-3"
        >
          ➕ Add Row
        </button>
      </div>

      {/* Submit */}
      <div className="text-center mt-6">
        <button
          onClick={handleSubmit}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold"
        >
          ✅ Submit
        </button>
      </div>
    </div>
  );
};

export default CustomProductForm;
