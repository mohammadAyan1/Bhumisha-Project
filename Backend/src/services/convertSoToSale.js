// services/convertSoToSale.js

/**
 * Generates a formatted response for converting SO to Sale
 * @param {Object} soHeader - The SO header data
 * @param {Array} soItems - The SO items data
 * @returns {Object} Formatted data for sale creation
 */
const generateSoToSaleResponse = (soHeader, soItems) => {
  return {
    so_id: soHeader.id,
    party_type: soHeader.party_type,
    customer_id: soHeader.customer_id,
    vendor_id: soHeader.vendor_id,
    farmer_id: soHeader.farmer_id,
    bill_date: new Date().toISOString().split('T')[0], // Today's date
    bill_time: new Date().toLocaleTimeString('en-US', { hour12: false }),
    address: soHeader.address,
    mobile_no: soHeader.mobile_no,
    gst_no: soHeader.gst_no, 
    buyer_type: soHeader.buyer_type,
    items: soItems.map(item => ({
      product_id: item.product_id,
      hsn_code: item.hsn_code,
      qty: item.qty,
      rate: item.rate,
      discount_per_qty: item.discount_per_qty,
      gst_percent: item.gst_percent,
      amount: item.amount,
      discount_total: item.discount_total,
      gst_amount: item.gst_amount,
      final_amount: item.final_amount
    })),
    status: "Active",
    payment_status: "Unpaid",
    payment_method: soHeader.payment_method || "Cash",
    other_amount: soHeader.other_amount || 0,
    other_note: soHeader.other_note || "",
    cash_received: 0
  };
};

module.exports = {
  generateSoToSaleResponse
};