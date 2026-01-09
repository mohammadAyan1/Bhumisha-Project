import { configureStore } from "@reduxjs/toolkit";
import vendorReducer from "../features/vendor/vendorSlice";
import farmerReducer from "./../features/farmers/farmerSlice"; // 👈 naya slice import
import categoryReducer from "./../features/Categories/categoiresSlice"; // 👈 naya slice import
import productReducer from "../features/products/productsSlice";
import purchasesReducer from "../features/purchase/purchaseSlice";
import purchaseOrdersReducer from "../features/purchaseOrders/purchaseOrderSlice";
import customerSlice from "../features/customer/customerSlice";
import farmReducer from "../features/Farm/FarmSlice";
import clusterReducer from "../features/clusterAdded/ClusterAdded"; // 👈 naya slice import
import clusterProductsReducer from "../features/clusterProduct/clusterProducts";
import secondClusterProdutsReducer from "../features/ClusterProducts/ClusterProducts";
import clusterInvetoryReducer from "../features/ClusterInventory/ClusterInventory";
import clusterTransactionReducer from "../features/ClusterTransaction/ClusterTransaction";
import clusterCultivateReducer from "../features/clusterCultivate/ClusterCultivate";
const store = configureStore({
  reducer: {
    vendors: vendorReducer,
    farmers: farmerReducer,
    categories: categoryReducer,
    products: productReducer, // ✅ Add products
    purchases: purchasesReducer,
    purchaseOrders: purchaseOrdersReducer,
    customer: customerSlice,
    farms: farmReducer,
    clusters: clusterReducer, // ✅ Add clusters
    clusterProducts: clusterProductsReducer, // ✅ Add cluster products
    secondClusterProducts: secondClusterProdutsReducer,
    clusterInventory: clusterInvetoryReducer,
    clusterTransaction: clusterTransactionReducer,
    clusterCultivate: clusterCultivateReducer,
  },
});

export default store;
